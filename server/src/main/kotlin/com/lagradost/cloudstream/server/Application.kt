package com.lagradost.cloudstream.server

import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import com.lagradost.cloudstream.server.proxy.streamProxyRoutes
import com.lagradost.cloudstream.server.routes.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8080
    val host = System.getenv("HOST") ?: "0.0.0.0"

    println("Starting CloudStream Web Server on http://$host:$port ...")
    ServerPluginLoader.init()

    embeddedServer(Netty, port = port, host = host) {
        module()
    }.start(wait = true)
}

fun Application.module() {
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.Range)
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Delete)
        exposeHeader(HttpHeaders.ContentLength)
        exposeHeader(HttpHeaders.ContentRange)
        exposeHeader(HttpHeaders.AcceptRanges)
    }

    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            encodeDefaults = true
        })
    }

    install(CallLogging)

    routing {
        get("/") {
            call.respondText("CloudStream Web Headless Server & Proxy is running!", ContentType.Text.Plain)
        }

        get("/api/health") {
            call.respond(
                mapOf(
                    "status" to "healthy",
                    "activeProviders" to ServerPluginLoader.getActiveProviders().size.toString(),
                    "totalProviders" to ServerPluginLoader.getAllProviders().size.toString()
                )
            )
        }

        catalogRoutes()
        searchRoutes()
        loadRoutes()
        linksRoutes()
        pluginsRoutes()
        metaRoutes()
        streamProxyRoutes()
    }
}
