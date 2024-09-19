import express from "express"
import {Request} from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { config } from "dotenv"
import { verify } from "jsonwebtoken"
import { hash, compare } from "bcrypt"
import path from "path"
import fakeDB from "./fakeDB";
import session from "express-session"
import { 
  createAT,
  createRT,
  // sendAT,
  // sendRT,
  isAuth
} from "./tokens"
// import 'express-session';

declare module 'express-session' {
  interface SessionData {
    uid?: string; // Add any other custom properties here
  }
}


config()
const server = express();
const salt = "this is salt"

// server.use(session({
//     secret: 'your-secret-key', // Replace with a strong secret key
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false } 
// }))

server.use(express.static(path.join(__dirname, "public/static")));
server.use(cookieParser())
server.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.set("view engine", "ejs");
server.set("views", "./public/pages");


server.get("/", (req, res) => {
    // req.session.uid = "bnk"
    // res.cookie("naem", "sdfsdf")
    res.render("index")
})


server.get("/login", (req, res) => {
    // req.session.uid = "bnk"
    // res.cookie("naem", "sdfsdf")
    res.render("login")
})

server.post("/login", async (req, res) => {
    // if(req.session.uid) console.log(req.session.uid)
    // res.header("hiii", "hello")
    // res.render("login")
    try {
        let { email, password } = req.body;
        let user:any = fakeDB.find( usr => usr.email == email)
        if(!user) res.json({"status":"user doesnt exist"})
        if(!await compare(password,user.password)) res.json({"status":"wrong password"})
        const accesstoken = createAT(user.id);
        const refreshtoken = createRT(user.id);
        user.refreshtoken = refreshtoken;
        console.log(refreshtoken)
        console.log(user)
        res.cookie("refreshtoken",refreshtoken,{
          httpOnly:true,
          path: '/token_refresh'
        })
        res.send({accesstoken:accesstoken,email:req.body.email})
    }catch(err){ console.log(err) }
})

server.post("/register", async (req, res) => {
    try {
        let { email, password } = req.body
        let user = fakeDB.find((usr) => usr.email == email);
        if (user) res.json({ "staus": "user already exists" })
        let hashedPassword = await hash(password, 10)
        fakeDB.push({
            id: fakeDB.length + 1,
            email: email,
            password: hashedPassword
        })
        console.log(fakeDB)
        // res.cookie("naem", "sdfsdf")
        res.json({ "staus": "user added" })
    } catch (err) { console.log(err) }
})

server.post("/logout",async (req,res)=>{
  res.clearCookie("refreshtoken", {path: "/token_refresh"})
  res.clearCookie("accesstoken")
  return res.json({"status":"logged out"})
})

server.post("/protected", async (req,res)=>{
  try{
    let id = isAuth(req,res)
    res.send({"status":"you have entered the protected route with id:"+id})
  }
  catch(err){ console.log(err) }
})

server.post("/token_refresh",(req,res)=>{
  const token = req.cookies.refreshtoken;
  console.log(token)
  if(!token)  res.send({accesstoken: ''})
  let payload:any = ''
  try{
    payload = verify(token,"jwtauthserver") 
  }catch(err) {
    console.log("error in verify")
    console.log(err)
    res.send({accesstoken: '0'})
  }
  const user:any = fakeDB.find(user => user.id == payload.id)
  if(!user) res.send({accesstoken: '1'})
  if(user.refreshtoken !== token)
    res.send({accesstoken: '2'})
  const accesstoken = createAT(user.id)
  const refreshtoken = createRT(user.id);
  user.refreshtoken = refreshtoken
  res.cookie("refreshtoken",refreshtoken,{
    httpOnly: true,
    path: '/token_refresh'
  })
  res.send({accesstoken:accesstoken,email:req.body.email,status:"sucessfully refreshed"})
})


server.get("/about", (req, res) => {
    res.write("<h1>about</h1>")
    res.end() //if not end is called it will continue listening
})

server.listen(process.env.PORT, () => {
    console.log(`server started at http://localhost:${process.env.PORT}`)
})

