package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.models.AniSkipResponseDTO
import com.lagradost.cloudstream3.app
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

fun Route.metaRoutes() {
    route("/api/meta") {
        get("/aniskip") {
            val malId = call.request.queryParameters["malId"]
            val ep = call.request.queryParameters["episode"] ?: "1"

            if (malId.isNullOrBlank()) {
                call.respond(AniSkipResponseDTO(found = false))
                return@get
            }

            val targetUrl = "https://api.aniskip.com/v2/skip-times/$malId/$ep?types[]=op&types[]=ed&episodeLength=0"
            try {
                val res = app.get(targetUrl)
                if (!res.isSuccessful) {
                    call.respond(AniSkipResponseDTO(found = false))
                    return@get
                }

                val jsonElement = Json.parseToJsonElement(res.text).jsonObject
                val found = jsonElement["found"]?.jsonPrimitive?.toString()?.toBooleanStrictOrNull() ?: false
                if (!found) {
                    call.respond(AniSkipResponseDTO(found = false))
                    return@get
                }

                val results = jsonElement["results"]?.jsonArray
                var opStart: Double? = null
                var opEnd: Double? = null
                var edStart: Double? = null
                var edEnd: Double? = null

                results?.forEach { item ->
                    val obj = item.jsonObject
                    val skipType = obj["skipType"]?.jsonPrimitive?.content
                    val interval = obj["interval"]?.jsonObject
                    val start = interval?.get("startTime")?.jsonPrimitive?.doubleOrNull
                    val end = interval?.get("endTime")?.jsonPrimitive?.doubleOrNull

                    if (skipType == "op") {
                        opStart = start
                        opEnd = end
                    } else if (skipType == "ed") {
                        edStart = start
                        edEnd = end
                    }
                }

                call.respond(
                    AniSkipResponseDTO(
                        found = true,
                        opStart = opStart,
                        opEnd = opEnd,
                        edStart = edStart,
                        edEnd = edEnd
                    )
                )
            } catch (_: Exception) {
                call.respond(AniSkipResponseDTO(found = false))
            }
        }
    }
}
