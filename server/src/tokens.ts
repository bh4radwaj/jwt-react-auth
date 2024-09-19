import { sign,verify } from "jsonwebtoken"

// var ATS:any = process.env.ACCESS_TOKEN_SECRET;
// var RTS:any = process.env.REFRESH_TOKEN_SECRET;
// console.log(ATS)
// console.log(RTS)
var ATS = "jwtauthserver"
var RTS = "jwtauthserver"

const createAT = (id:any)=>{
  return sign({id},ATS,{
    expiresIn: "15m"
  })
}

const createRT = (id:any)=>{
  return sign({id},RTS,{
    expiresIn: "15m"
  })
}

const sendAT = (req:any,res:any,at:string) =>{
  res.send({accesstoken:at,email:req.body.email})
}


const sendRT = (res:any,rt:string) =>{
  res.cookie("refreshtoken",rt,{
    httpOnly: true,
    path: '/refresh_token'
  })
}

const isAuth = (req:any,res:any) =>{
  const incoming = req.headers["authorization"]
  console.log(incoming)
  if(!incoming) res.send("you need to login")
  const token = incoming.split(" ")[1]
  console.log(token)
  const data:any = verify(token,ATS)
  console.log(data)
  return data.id;
}


export {createAT,createRT,sendAT,sendRT,isAuth}
