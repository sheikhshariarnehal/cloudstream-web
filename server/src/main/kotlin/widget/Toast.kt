package android.widget

import android.content.Context

class Toast(val context: Context?) {
    companion object {
        const val LENGTH_SHORT = 0
        const val LENGTH_LONG = 1

        @JvmStatic
        fun makeText(context: Context?, text: CharSequence?, duration: Int): Toast {
            println("TOAST: $text")
            return Toast(context)
        }
    }

    fun show() {
        // Desktop stub log
    }
}
