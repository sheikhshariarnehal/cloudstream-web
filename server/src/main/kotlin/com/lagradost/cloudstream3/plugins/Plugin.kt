package com.lagradost.cloudstream3.plugins

import android.content.Context

abstract class Plugin : BasePlugin() {
    open fun load(context: Context) {}
}
