pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        kotlin("jvm") version "2.4.0"
        kotlin("plugin.serialization") version "2.4.0"
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
        mavenLocal()
        maven("https://jitpack.io")
    }
}

rootProject.name = "cloudstream-web-server"

// Link to the main cloudstream codebase
includeBuild("../../cloudstream") {
    dependencySubstitution {
        substitute(module("com.lagradost.api:library")).using(project(":library"))
    }
}
