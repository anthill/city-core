// package builders.ants.bordeaux3d

// import org.joda.time.{ DateTimeZone, DateTime }
// import org.joda.time.format.{ DateTimeFormat, ISODateTimeFormat }
// import scala.collection.mutable.{ Map => MutableMap }
// import java.io._
// import org.jsoup.Jsoup
// import org.jsoup.nodes.{ Element, Document }

// object Utils {

//   private val utcTimezone = DateTimeZone.forID("UTC")
//   private val isoSimpleDateTimeFormatter = DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss")
//   private val isoDateTimeFormatter = ISODateTimeFormat.dateTimeNoMillis().withOffsetParsed

//   def formatSimpleDateTime(dt: DateTime): String = isoSimpleDateTimeFormatter.print(dt)
//   def parseDateTime(dt: String): DateTime = isoSimpleDateTimeFormatter.withZone(utcTimezone).parseDateTime(dt)

//   def printIso(dt: DateTime): String = isoDateTimeFormatter.print(dt)
//   def parseIso(s: String): DateTime = isoDateTimeFormatter.parseDateTime(s)

//   // finds the closest date in the map
//   def findClosestTime(dateTime: DateTime, meteoMap: MutableMap[DateTime, Measure]): DateTime = {
//     val keys = meteoMap.keySet.toList
//     val diffs = keys.map(key => scala.math.abs(key.getMillis - dateTime.getMillis))
//     val index = diffs.zipWithIndex.min._2
//     keys(index)
//   }

//   def writeToEndOfFile(filename: String, string: String): Unit = {
//     try {
//       val out = new PrintWriter(new BufferedWriter(new FileWriter(filename, true)))
//       out.println(string)
//       out.close
//     } catch { case e: Exception => println("Couldn't write to file.") }
//   }

//   @annotation.tailrec
//   def retry[T](n: Int)(fn: => T): T = {
//     util.Try { fn } match {
//       case util.Success(x) => x
//       case _ if n > 1 => retry(n - 1)(fn)
//       case util.Failure(e) => throw e
//     }
//   }

//   //get data
//   def getData(url: String): Document = {
//     retry(10)(Jsoup.connect(url).get())
//   }

// }

