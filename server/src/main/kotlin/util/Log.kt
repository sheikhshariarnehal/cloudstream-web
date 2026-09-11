package android.util

object Log {
    @JvmStatic fun v(tag: String?, msg: String?): Int = println("VERBOSE [$tag]: $msg").let { 0 }
    @JvmStatic fun d(tag: String?, msg: String?): Int = println("DEBUG [$tag]: $msg").let { 0 }
    @JvmStatic fun i(tag: String?, msg: String?): Int = println("INFO [$tag]: $msg").let { 0 }
    @JvmStatic fun w(tag: String?, msg: String?): Int = println("WARN [$tag]: $msg").let { 0 }
    @JvmStatic fun e(tag: String?, msg: String?): Int = println("ERROR [$tag]: $msg").let { 0 }
    @JvmStatic fun e(tag: String?, msg: String?, tr: Throwable?): Int = println("ERROR [$tag]: $msg \n ${tr?.stackTraceToString()}").let { 0 }
}
