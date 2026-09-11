package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.plugins.PluginManifest
import com.lagradost.cloudstream.server.plugins.RepoManager
import com.lagradost.cloudstream.server.plugins.SavedRepo
import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class AddRepoRequest(val name: String, val url: String)

@Serializable
data class TogglePluginRequest(val name: String, val enabled: Boolean)

fun Route.pluginsRoutes() {
    route("/api") {

        get("/repos") {
            call.respond(RepoManager.getSavedRepos())
        }

        post("/repos") {
            val req = try { call.receive<AddRepoRequest>() } catch (_: Exception) { null }
            if (req == null || req.url.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url")
                return@post
            }
            val added = RepoManager.addRepo(req.name, req.url)
            if (added) {
                call.respond(HttpStatusCode.Created, mapOf("status" to "added", "url" to RepoManager.resolveUrl(req.url)))
            } else {
                call.respond(HttpStatusCode.Conflict, "Repository already exists")
            }
        }

        delete("/repos") {
            val url = call.request.queryParameters["url"]
            if (url.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@delete
            }
            val removed = RepoManager.removeRepo(url)
            call.respond(mapOf("status" to if (removed) "removed" else "not_found"))
        }

        get("/plugins/repo") {
            val url = call.request.queryParameters["url"]
            if (url.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }
            val plugins = RepoManager.fetchRepoPlugins(url)
            call.respond(plugins)
        }

        post("/plugins/install") {
            val manifest = try { call.receive<PluginManifest>() } catch (_: Exception) { null }
            if (manifest == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid plugin manifest")
                return@post
            }
            val success = RepoManager.installPlugin(manifest)
            if (success) {
                call.respond(HttpStatusCode.OK, mapOf("status" to "installed", "name" to manifest.name))
            } else {
                call.respond(HttpStatusCode.InternalServerError, "Failed to download or load plugin")
            }
        }

        post("/plugins/toggle") {
            val req = try { call.receive<TogglePluginRequest>() } catch (_: Exception) { null }
            if (req == null) {
                call.respond(HttpStatusCode.BadRequest, "Missing request body")
                return@post
            }
            ServerPluginLoader.setProviderEnabled(req.name, req.enabled)
            call.respond(mapOf("status" to "updated", "name" to req.name, "enabled" to req.enabled))
        }
    }
}
