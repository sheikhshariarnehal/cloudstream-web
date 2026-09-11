package android.content

import android.content.res.Resources

open class Context {
    open fun getPackageName(): String = "com.lagradost.cloudstream3"
    open fun getResources(): Resources = Resources()
    open fun getString(id: Int): String = ""
    open fun getString(id: Int, vararg formatArgs: Any): String = ""
    open fun getSharedPreferences(name: String, mode: Int): Any? = null
}
