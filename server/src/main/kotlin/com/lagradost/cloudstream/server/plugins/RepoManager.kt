package com.lagradost.cloudstream.server.plugins

import com.lagradost.cloudstream3.app
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.io.File
import java.util.concurrent.ConcurrentHashMap

@Serializable
data class PluginManifest(
    val name: String,
    val internalName: String? = null,
    val description: String? = null,
    val url: String? = null,
    val version: Int = 1,
    val authors: List<String> = emptyList(),
    val language: String? = null,
    val iconUrl: String? = null,
    val tvTypes: List<String> = emptyList(),
    val status: Int = 1,
    val repositoryUrl: String? = null
)

@Serializable
data class RepoManifest(
    val name: String,
    val description: String? = null,
    val manifestVersion: Int = 1,
    val pluginLists: List<String> = emptyList()
)

@Serializable
data class SavedRepo(
    val name: String,
    val url: String
)

object RepoManager {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    private val KNOWN_SHORTCODES = mapOf(
        "cspr" to "https://raw.githubusercontent.com/recloudstream/extensions/master/repo.json",
        "0094" to "https://raw.githubusercontent.com/recloudstream/extensions/master/repo.json",
        "megarepo" to "https://raw.githubusercontent.com/self-similarity/MegaRepo/builds/repo.json",
        "3737" to "https://raw.githubusercontent.com/self-similarity/MegaRepo/builds/repo.json",
        "phisherrepo" to "https://raw.githubusercontent.com/phisher98/cloudstream-extensions-phisher/builds/repo.json",
        "864" to "https://raw.githubusercontent.com/phisher98/cloudstream-extensions-phisher/builds/repo.json",
        "csx" to "https://raw.githubusercontent.com/SaurabhKaperwan/CSX/builds/CS.json",
        "3670" to "https://raw.githubusercontent.com/SaurabhKaperwan/CSX/builds/CS.json"
    )

    private val reposFile: File by lazy {
        val userHome = System.getProperty("user.home") ?: "."
        val dir = File(userHome, ".cloudstream_web")
        if (!dir.exists()) dir.mkdirs()
        File(dir, "repos.json")
    }

    private val cachedPlugins = ConcurrentHashMap<String, List<PluginManifest>>()

    fun resolveUrl(input: String): String {
        val trimmed = input.trim()
        return KNOWN_SHORTCODES[trimmed.lowercase()] ?: trimmed
    }

    fun getSavedRepos(): List<SavedRepo> {
        return try {
            if (reposFile.exists() && reposFile.length() > 2) {
                json.decodeFromString(ListSerializer(SavedRepo.serializer()), reposFile.readText())
            } else {
                val defaults = listOf(
                    SavedRepo("CloudStream Official", "https://raw.githubusercontent.com/recloudstream/extensions/master/repo.json"),
                    SavedRepo("MegaRepo", "https://raw.githubusercontent.com/self-similarity/MegaRepo/builds/repo.json")
                )
                saveRepos(defaults)
                defaults
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveRepos(repos: List<SavedRepo>) {
        try {
            val text = json.encodeToString(ListSerializer(SavedRepo.serializer()), repos)
            reposFile.writeText(text)
        } catch (e: Exception) {
            println("[RepoManager] Error saving repos: ${e.message}")
        }
    }

    fun addRepo(name: String, rawUrl: String): Boolean {
        val resolved = resolveUrl(rawUrl)
        val current = getSavedRepos().toMutableList()
        if (current.any { it.url.equals(resolved, ignoreCase = true) }) return false
        current.add(SavedRepo(name.ifBlank { "Custom Repo" }, resolved))
        saveRepos(current)
        return true
    }

    fun removeRepo(url: String): Boolean {
        val current = getSavedRepos().toMutableList()
        val changed = current.removeIf { it.url.equals(url, ignoreCase = true) }
        if (changed) {
            saveRepos(current)
            cachedPlugins.remove(url)
        }
        return changed
    }

    suspend fun fetchRepoPlugins(repoUrl: String): List<PluginManifest> = withContext(Dispatchers.IO) {
        val resolved = resolveUrl(repoUrl)
        try {
            val res = app.get(resolved)
            val text = res.text
            val plugins = mutableListOf<PluginManifest>()

            try {
                val directPlugins = json.decodeFromString<List<PluginManifest>>(text)
                plugins.addAll(directPlugins)
            } catch (_: Exception) {
                try {
                    val manifest = json.decodeFromString<RepoManifest>(text)
                    for (subList in manifest.pluginLists) {
                        try {
                            val subRes = app.get(subList)
                            val subPlugins = json.decodeFromString<List<PluginManifest>>(subRes.text)
                            plugins.addAll(subPlugins)
                        } catch (_: Exception) {}
                    }
                } catch (_: Exception) {}
            }

            cachedPlugins[resolved] = plugins
            plugins
        } catch (e: Exception) {
            println("[RepoManager] Error fetching repo $repoUrl: ${e.message}")
            emptyList()
        }
    }

    suspend fun installPlugin(manifest: PluginManifest): Boolean = withContext(Dispatchers.IO) {
        val downloadUrl = manifest.url ?: return@withContext false
        try {
            val fileName = (manifest.internalName ?: manifest.name).replace(Regex("[^a-zA-Z0-9_]"), "") + ".cs3"
            val targetFile = File(ServerPluginLoader.pluginsDir, fileName)
            val bytes = app.get(downloadUrl).body.bytes()
            targetFile.writeBytes(bytes)
            ServerPluginLoader.loadPluginFile(targetFile)
        } catch (e: Exception) {
            println("[RepoManager] Failed installing plugin ${manifest.name}: ${e.message}")
            false
        }
    }
}
