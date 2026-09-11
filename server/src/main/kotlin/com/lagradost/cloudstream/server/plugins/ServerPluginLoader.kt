package com.lagradost.cloudstream.server.plugins

import com.lagradost.cloudstream3.APIHolder
import com.lagradost.cloudstream3.MainAPI
import com.lagradost.cloudstream3.plugins.BasePlugin
import kotlinx.serialization.json.Json
import java.io.File
import java.net.URLClassLoader
import java.util.concurrent.ConcurrentHashMap
import java.util.jar.JarFile

object ServerPluginLoader {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private val disabledProviders = ConcurrentHashMap.newKeySet<String>()

    val pluginsDir: File by lazy {
        val userHome = System.getProperty("user.home") ?: "."
        val dir = File(userHome, ".cloudstream_web/plugins")
        if (!dir.exists()) dir.mkdirs()
        dir
    }

    fun init() {
        registerBuiltInProviders()
        loadAllLocalPlugins()
    }

    private fun registerBuiltInProviders() {
        try {
            val providers = listOf<MainAPI>(
                com.redowan.CircleFtpProvider(),
                com.redowan.BdixICCFtpProvider(),
                com.nehal.ctgmovies.CTGMoviesProvider(),
                com.nehal.cineplexbd.CineplexBDProvider(),
                com.nehal.dhakaflix.DhakaFlixProvider(),
                com.nehal.dhakaflixbdix.DhakaFlixBDIXProvider(),
                com.nehal.discoveryftp.DiscoveryFTPProvider(),
                com.nehal.ftpbd.FTPBDProvider(),
                com.nehal.fmftp.FmFtpProvider(),
                com.nehal.jellyfinbd.JellyfinBDProvider(),
                com.nehal.showtimebd.ShowTimeBDProvider(),
                com.nehal.vegamovies.VegaMoviesProvider(),
                com.allwish.AllWish(),
                com.aniwatch.Aniwatch(),
                com.cncverse.MovieBoxProviderIN()
            )

            providers.forEach { api ->
                APIHolder.allProviders.add(api)
                APIHolder.addPluginMapping(api)
            }

            // Register native custom extractors
            try {
                com.lagradost.cloudstream3.utils.extractorApis.add(com.aniwatch.MegaPlay())
                com.lagradost.cloudstream3.utils.extractorApis.add(com.allwish.MegaPlay())
                com.lagradost.cloudstream3.utils.extractorApis.add(com.allwish.Zen())
                com.lagradost.cloudstream3.utils.extractorApis.add(com.allwish.Vidwish())
                com.lagradost.cloudstream3.utils.extractorApis.add(com.nehal.vegamovies.VCloud())
            } catch (_: Throwable) {}

            println("[ServerPluginLoader] Registered ${providers.size} built-in providers successfully")
        } catch (e: Throwable) {
            println("[ServerPluginLoader] Warning registering built-in providers: ${e.message}")
        }
    }

    fun getAllProviders(): List<MainAPI> {
        return APIHolder.allProviders.distinctBy { it.name }
    }

    fun getActiveProviders(): List<MainAPI> {
        return APIHolder.allProviders.filter { !disabledProviders.contains(it.name) }.distinctBy { it.name }
    }

    fun getProvider(name: String?): MainAPI? {
        if (name == null) return null
        return APIHolder.getApiFromNameNull(name)
    }

    fun setProviderEnabled(name: String, enabled: Boolean) {
        if (enabled) {
            disabledProviders.remove(name)
        } else {
            disabledProviders.add(name)
        }
    }

    fun isProviderEnabled(name: String): Boolean {
        return !disabledProviders.contains(name)
    }

    fun loadAllLocalPlugins() {
        val files = pluginsDir.listFiles { f -> f.extension.equals("cs3", ignoreCase = true) || f.extension.equals("jar", ignoreCase = true) } ?: return
        for (file in files) {
            try {
                loadPluginFile(file)
            } catch (e: Throwable) {
                println("[ServerPluginLoader] Failed loading plugin ${file.name}: ${e.message}")
            }
        }
    }

    fun loadPluginFile(jarFile: File): Boolean {
        return try {
            val jar = JarFile(jarFile)
            val dexClassesMap = mutableMapOf<String, ByteArray>()
            val dexEntry = jar.getJarEntry("classes.dex")

            if (dexEntry != null) {
                println("[ServerPluginLoader] Translating DEX in ${jarFile.name} to JVM bytecode...")
                val dexBytes = jar.getInputStream(dexEntry).readBytes()
                val options = software.coley.dextranslator.Options()
                    .setLenient(true)
                    .setReplaceInvalidMethodBodies(true)
                val appData = software.coley.dextranslator.model.ApplicationData.fromDex(dexBytes, options)
                val translatedMap = try {
                    appData.exportToJvmClassMap()
                } catch (batchErr: Throwable) {
                    val singleMap = mutableMapOf<String, ByteArray>()
                    for (className in appData.classNames) {
                        val cleanSlash = className.removePrefix("L").removeSuffix(";")
                        val variations = listOf(className, cleanSlash, "L$cleanSlash;")
                        var exportedBytes: ByteArray? = null
                        for (v in variations) {
                            try {
                                val b = appData.exportToJvmClass(v)
                                if (b != null && b.isNotEmpty()) {
                                    exportedBytes = b
                                    break
                                }
                            } catch (_: Throwable) {}
                        }
                        if (exportedBytes != null) {
                            singleMap[className] = exportedBytes
                            singleMap[cleanSlash] = exportedBytes
                        }
                    }
                    singleMap
                }

                for ((k, v) in translatedMap) {
                    val clean = k.removePrefix("L").removeSuffix(";")
                    dexClassesMap[k] = v
                    dexClassesMap[clean] = v
                    dexClassesMap[clean.replace('/', '.')] = v
                    dexClassesMap[clean.replace('.', '/')] = v
                    dexClassesMap["L" + clean.replace('.', '/') + ";"] = v
                }
                println("[ServerPluginLoader] Translated ${translatedMap.size} classes from ${jarFile.name}")
            }

            val classLoader = object : URLClassLoader(
                arrayOf(jarFile.toURI().toURL()),
                ServerPluginLoader::class.java.classLoader
            ) {
                override fun findClass(name: String): Class<*> {
                    val clean = name.removePrefix("L").removeSuffix(";")
                    val slash = clean.replace('.', '/')
                    val dot = clean.replace('/', '.')
                    val bytes = dexClassesMap[name]
                        ?: dexClassesMap[clean]
                        ?: dexClassesMap[slash]
                        ?: dexClassesMap[dot]
                        ?: dexClassesMap["L$slash;"]
                    if (bytes != null) {
                        return try {
                            defineClass(dot, bytes, 0, bytes.size)
                        } catch (e: LinkageError) {
                            findLoadedClass(dot) ?: throw e
                        }
                    }
                    return super.findClass(name)
                }
            }

            // Read manifest.json inside JAR
            val manifestEntry = jar.getJarEntry("manifest.json")
            if (manifestEntry != null) {
                val manifestText = jar.getInputStream(manifestEntry).bufferedReader().readText()
                val manifest = json.decodeFromString<BasePlugin.Manifest>(manifestText)
                val pluginClass = classLoader.loadClass(manifest.pluginClassName)
                val pluginInstance = pluginClass.getDeclaredConstructor().newInstance() as? BasePlugin
                if (pluginInstance != null) {
                    try {
                        val loadMethod = pluginClass.getMethod("load", android.content.Context::class.java)
                        loadMethod.invoke(pluginInstance, android.content.Context())
                    } catch (_: Throwable) {
                        try {
                            val emptyLoad = pluginClass.getMethod("load")
                            emptyLoad.invoke(pluginInstance)
                        } catch (_: Throwable) {
                            pluginInstance.load()
                        }
                    }
                    println("[ServerPluginLoader] Successfully loaded plugin: ${manifest.name}")
                    return true
                }
            }
            false
        } catch (t: Throwable) {
            println("[ServerPluginLoader] Error loading ${jarFile.name}: ${t.message}")
            false
        }
    }
}
