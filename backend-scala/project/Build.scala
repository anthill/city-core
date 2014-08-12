import sbt._
import Keys._
import sbtassembly.Plugin._
import AssemblyKeys._
import spray.revolver.RevolverPlugin._
import org.scalastyle.sbt._
import com.markatta.sbttaglist.TagListPlugin
import com.typesafe.sbt.SbtScalariform
import sbt.Package.ManifestAttributes

object ForecasterBuild extends Build {

  val akkaVersion = "2.3.3"
  val sprayVersion = "1.3.1"
  
  lazy val sharedSettings = Project.defaultSettings ++
    ScalastylePlugin.Settings ++ 
    Seq(assemblySettings: _*) ++ 
    Revolver.settings ++ 
    TagListPlugin.tagListSettings ++ 
    SbtScalariform.scalariformSettings ++
    Seq(
      name := "bordeaux3d",
      description := "Api serving 3d buildings",
      organizationName := "ANTS",
      organization := "builders.ants",
      version := "0.1.0",
      scalaVersion := "2.10.3",
      libraryDependencies ++= Seq(

        //Testing and logging
        "com.typesafe" %% "scalalogging-slf4j" % "1.1.0",
        "org.specs2" %% "specs2" % "2.2.3" % "test",

        //Spray
        "io.spray" % "spray-client" % sprayVersion,
        "io.spray" %% "spray-json" % "1.2.6",
        "io.spray" % "spray-routing" % sprayVersion,
        "io.spray" % "spray-testkit" % sprayVersion,
        
        //Akka
        "com.typesafe.akka" %% "akka-actor" % akkaVersion,
        "com.typesafe.akka" %% "akka-testkit" % akkaVersion,
        "com.typesafe.akka" % "akka-slf4j_2.10" % akkaVersion,
        
        //Joda time
        "joda-time" % "joda-time" % "2.3",
        "org.joda" % "joda-convert" % "1.6",
        
        //Other
        "com.meetup" %% "archery" % "0.3.0",
        "com.github.hjast" % "geodude_2.10" % "0.2.0",
        "org.reactivemongo" %% "reactivemongo" % "0.11.0-SNAPSHOT",
        "org.mongodb" %% "casbah" % "2.7.3"

      ),
      resolvers ++= Seq(
        Opts.resolver.sonatypeSnapshots,
        Opts.resolver.sonatypeReleases,
        "Clojars Repository" at "http://clojars.org/repo",
        "Conjars Repository" at "http://conjars.org/repo",
        "Adam Gent Maven Repository" at "http://mvn-adamgent.googlecode.com/svn/maven/release",
        "opengeo" at "http://repo.opengeo.org/",
        "osgeo" at "http://download.osgeo.org/webdav/geotools/",
        "Akka Repository" at "http://repo.akka.io/releases/",
        "Spray repo" at "http://repo.spray.io/",
        "bintray/meetup" at "http://dl.bintray.com/meetup/maven",
        "Sonatype Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots/",
        "Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/"
      ),
      parallelExecution in Test := false,
      scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-language:implicitConversions", "-language:reflectiveCalls", "-language:postfixOps", "-Yresolve-term-conflict:package"),
      publishMavenStyle := true,
      pomIncludeRepository := { x => false },
      publishArtifact in Test := false,
      javaOptions += "-Xmx5G",
      mergeStrategy in assembly <<= (mergeStrategy in assembly) { (old) =>
        {
          case m if m.toLowerCase.matches(".*akka/remote/transport/netty/.*") => MergeStrategy.first // Akka fix
          case m if m.toLowerCase.matches("meta-inf.*") => MergeStrategy.discard
          case m if m.toLowerCase.matches("log4j.properties") => MergeStrategy.discard
          case m if m.toLowerCase.matches("application.conf") => MergeStrategy.concat
          case m if m.toLowerCase.matches("reference.conf") => MergeStrategy.concat
          //case x => old(x)
          case _ => MergeStrategy.first
        }
      }
    )

  lazy val bordeaux3d = Project(id="bordeaux3d", base=file("."), settings=sharedSettings).settings(
    jarName in assembly := "bordeaux3d.jar",
    mainClass in (Compile, run) := Some("builders.ants.bordeaux3d.Api"),
    mainClass in assembly := Some("builders.ants.bordeaux3d.Api")
  )
}
