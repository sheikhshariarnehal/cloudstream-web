package android.net

import java.net.URI

class Uri private constructor(private val javaUri: URI?) {
    fun getScheme(): String? = javaUri?.scheme
    fun getHost(): String? = javaUri?.host
    fun getPath(): String? = javaUri?.path
    fun getQuery(): String? = javaUri?.query
    override fun toString(): String = javaUri?.toString() ?: ""

    companion object {
        @JvmStatic
        fun parse(uriString: String?): Uri {
            return try {
                Uri(if (uriString != null) URI.create(uriString) else null)
            } catch (_: Exception) {
                Uri(null)
            }
        }
    }
}
