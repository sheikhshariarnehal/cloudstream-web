package android.os

class Looper private constructor() {
    companion object {
        private val mainLooper = Looper()
        @JvmStatic fun getMainLooper(): Looper = mainLooper
        @JvmStatic fun myLooper(): Looper? = mainLooper
    }
}

open class Handler @JvmOverloads constructor(looper: Looper? = Looper.getMainLooper()) {
    open fun post(r: Runnable): Boolean {
        r.run()
        return true
    }
    open fun postDelayed(r: Runnable, delayMillis: Long): Boolean {
        Thread {
            try { Thread.sleep(delayMillis) } catch (_: Exception) {}
            r.run()
        }.start()
        return true
    }
}
