package builders.ants.bordeaux3d

import akka.actor.{ Actor, ActorSystem, Props }
import akka.pattern.ask
import scala.concurrent.{ Await, Future }
import spray.routing.SimpleRoutingApp
import spray.http._
import StatusCodes._
import scala.concurrent.ExecutionContext
import reflect.ClassTag
import akka.util.Timeout
import scala.concurrent.duration._
import spray.httpx.SprayJsonSupport._
import scala.util.{ Try, Success, Failure }

import spray.json._
import DefaultJsonProtocol._

object Api extends App with SimpleRoutingApp {

  implicit val ec = ExecutionContext.Implicits.global
  implicit val system = ActorSystem("bordeaux3d")
  implicit val timeout = Timeout(5 seconds)

  val sheppard = system.actorOf(Props[ObjectSheppard], "sheppard")

  val completeCompressedCrossOrigin = {
    respondWithHeader(HttpHeaders.RawHeader("Access-Control-Allow-Origin", "*")) &
      compressResponse() &
      complete
  }

  startServer(interface = "0.0.0.0", port = 8080) {
    path("getObjects") {
      get {
        parameters("north", "east", "south", "west") { (north, east, south, west) =>

          //Try to build a object request from the params
          Try(GetObjects(north.toFloat, east.toFloat, south.toFloat, west.toFloat)) match {

            //Failed to parse lat, lon
            case Failure(error) => completeCompressedCrossOrigin(BadRequest)

            //All good, send async to sheppard
            case Success(query) => onComplete(sheppard.ask(query).mapTo[List[String]]) {

              //All good, return the JSON response with the objects
              case Success(objects) =>
                println(s"number of objects fetched: ${objects.length}")
                completeCompressedCrossOrigin(objects)
              case Failure(error) => completeCompressedCrossOrigin(error)

              case _ => completeCompressedCrossOrigin(InternalServerError)
            }
          }
        }
      }
    }
  }

}
