plugins {
    kotlin("jvm") version "2.4.0"
    kotlin("plugin.serialization") version "2.4.0"
    application
}

group = "com.lagradost.cloudstream.server"
version = "1.0.0"

application {
    mainClass.set("com.lagradost.cloudstream.server.ApplicationKt")
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

tasks.withType<JavaCompile> {
    sourceCompatibility = "17"
    targetCompatibility = "17"
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        freeCompilerArgs.add("-Xjsr305=strict")
    }

    sourceSets {
        main {
            kotlin.srcDirs(
                "src/main/kotlin",
                "../../nehal-CloudStream/AllWish/src/main/kotlin",
                "../../nehal-CloudStream/Aniwatch/src/main/kotlin",
                "../../nehal-CloudStream/BdixCircleftp/src/main/kotlin",
                "../../nehal-CloudStream/BdixICCFtp/src/main/kotlin",
                "../../nehal-CloudStream/CTGMovies/src/main/kotlin",
                "../../nehal-CloudStream/CineplexBD/src/main/kotlin",
                "../../nehal-CloudStream/DhakaFlix/src/main/kotlin",
                "../../nehal-CloudStream/DhakaFlixBDIX/src/main/kotlin",
                "../../nehal-CloudStream/DiscoveryFTP/src/main/kotlin",
                "../../nehal-CloudStream/FTPBD/src/main/kotlin",
                "../../nehal-CloudStream/FmFtp/src/main/kotlin",
                "../../nehal-CloudStream/JellyfinBD/src/main/kotlin",
                "../../nehal-CloudStream/ShowTimeBD/src/main/kotlin",
                "../../nehal-CloudStream/VegaMovies/src/main/kotlin",
                "../../nehal-CloudStream/MovieBoxProviderIN/src/main/kotlin"
            )
        }
    }
}

val ktorVersion = "2.3.12"

dependencies {
    // CloudStream Core KMP Library
    implementation("com.lagradost.api:library")

    // Ktor Server Netty & Features
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
    implementation("io.ktor:ktor-server-status-pages:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-okhttp:$ktorVersion")

    // Coroutines & Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // OkHttp & NiceHttp (matches CloudStream)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.github.Blatzar:NiceHttp:0.4.11")
    implementation("org.jsoup:jsoup:1.17.2")
    implementation("org.mozilla:rhino:1.7.14")
    implementation("org.json:json:20231013")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.13.1")

    // DEX to JVM Class Bytecode Converter for Android .cs3 Plugins
    implementation("software.coley:dex-translator:1.1.1")
    implementation("com.android.tools:r8:8.5.35")
    implementation("org.ow2.asm:asm:9.7.1")
    implementation("org.ow2.asm:asm-tree:9.7.1")
    implementation("org.ow2.asm:asm-commons:9.7.1")
    implementation("org.ow2.asm:asm-util:9.7.1")
    implementation("org.ow2.asm:asm-analysis:9.7.1")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("com.google.guava:guava:33.2.1-jre")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.14")
}
