package builders.ants.bordeaux3d

import akka.actor.{ Actor, ActorSystem, Props, ActorRef, Terminated }
import akka.pattern.{ ask, pipe }
import scala.concurrent.{ Await, Future }
import akka.util.Timeout
import scala.concurrent.duration._

import scala.util.matching.Regex
import scala.io.Source
import scala.collection.immutable.Vector
import scala.collection.mutable.{ Map => MutableMap, Set => MutableSet, MutableList }

import archery.{ RTree => ArcheryRTree, Entry, Box => ArcheryBbox, Point => ArcheryPoint }
import com.mongodb.casbah.Imports._

case class GetObjects(north: Float, east: Float, south: Float, west: Float)

// case class Building(id: BSONObjectID, data: String, X: Float, Y: Float)

// object Building {
//   implicit object BuildingReader extends BSONDocumentReader[Building] {
//     def read(doc: BSONDocument): Building = {
//       val id = doc.getAs[BSONObjectID]("_id").get
//       val data = doc.getAs[String]("data").get
//       val X = doc.getAs[Float]("X").get
//       val Y = doc.getAs[Float]("Y").get

//       Building(id, data, X, Y)
//     }
//   }
// }

class ObjectSheppard extends Actor {

  implicit val system = ActorSystem("bordeaux3d")
  implicit val ec = scala.concurrent.ExecutionContext.Implicits.global

  // // rtree that contains the stations
  // var rtree = ArcheryRTree[String]()

  // // initialize the rtree
  val mongoClient = MongoClient("localhost", 27017)
  val db = mongoClient("bordeaux3d")
  val coll = db("buildings")
  // val entries = coll.map(doc => Entry(ArcheryPoint(doc("X").asInstanceOf[Double].toFloat, doc("Y").asInstanceOf[Double].toFloat), doc("_id").asInstanceOf[String])).toList
  // rtree = rtree.insertAll(entries)

  // val driver = new MongoDriver
  // val connection = driver.connection(List("localhost"))
  // val db = connection("bordeaux3d")
  // val collection = db("buildings")
  // val futureList = collection.find(BSONDocument()).cursor[Building].collect[List]()

  // futureList.map { list =>
  //   val entries = list.map(doc => Entry(ArcheryPoint(doc.X, doc.Y), doc.id))
  //   rtree = rtree.insertAll(entries)
  // }
  // println("Finished filling the rtree.")

  def receive = {

    case GetObjects(north, east, south, west) => {

      val fut: Future[List[String]] = {

        try {
          val query = { "loc".$geoWithin.$box(GeoCoords(west, south), GeoCoords(east, north)) }
          val result = coll.find(query).map(doc => doc.toString).toList
          Future.successful(result)
        } catch {
          case x: Throwable =>
            Future.failed(x)
        }
      }

      //Pipe result of future to sender
      fut pipeTo sender

    }

  }

}
