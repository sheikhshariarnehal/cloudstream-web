package android.content.res

import android.util.DisplayMetrics

open class AssetManager {
    fun open(fileName: String): java.io.InputStream = java.io.ByteArrayInputStream(byteArrayOf())
    fun list(path: String): Array<String>? = emptyArray()
}

open class Configuration

open class Resources @JvmOverloads constructor(
    val assets: AssetManager? = null,
    val displayMetrics: DisplayMetrics? = null,
    val configuration: Configuration? = null
) {
    open fun getString(id: Int): String = ""
    open fun getString(id: Int, vararg formatArgs: Any): String = ""
    open fun getIdentifier(name: String?, defType: String?, defPackage: String?): Int = 0
}
