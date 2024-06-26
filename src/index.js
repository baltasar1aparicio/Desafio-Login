import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import messageModel from './models/messages.js'
import orderModel from './models/order.js'
import indexRouter from './routes/index.routes.js'
import initializePassport from './config/passport.js'
import varenv from './dotenv.js'
import { Server } from 'socket.io'
import Handlebars from 'handlebars';
import { engine } from 'express-handlebars'
import { __dirname } from './path.js'
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access'




//Configuraciones o declaraciones
const app = express()
const PORT = 9000



//Server
const server = app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`)
})

const io = new Server(server)

//Connection DB
mongoose.connect(varenv.mongo_url)
    .then(() => console.log("DB is connected"))
    .catch(e => console.log(e))


const resultado = await orderModel.paginate({ status: true }, {limit: 10, page: 1, sort: {price: 'asc'}})
console.log(resultado)    
/*
const resultado = await orderModel.aggregate([
    {
        $match: { size: "small" } //filtro
    },
    {
        $group: { _id: "$name", totalQuantity: {$sum: "$quantity"}, totalPrice: {$sum: "$price"} }
    },
    {
        $sort: {totalPrice: -1}
    },
    {
        $group: {_id: 1, orders: {$push: "$$ROOT"}}
    },
    {
        $project: {
            "_id": 0,
            orders: "$orders"
        }
    },
    {
        $merge: {
            into: "reports"
        }
    }
    
])

console.log(resultado)
*/

/*await orderModel.insertMany([
    { name: "Napolitana", size: "small", price: 8000, quantity: 4 },
    { name: "4 quesos", size: "small", price: 12000, quantity: 4 },
    { name: "4 quesos", size: "medium", price: 14000, quantity: 2 },
    { name: "4 quesos", size: "large", price: 18000, quantity: 2 },
    { name: "4 quesos", size: "medium", price: 7000, quantity: 1 },
    { name: "Calabresa", size: "small", price: 5000, quantity: 2 },
    { name: "Calabresa", size: "medium", price: 8000, quantity: 2 },
    { name: "Calabresa", size: "large", price: 9000, quantity: 2 },
    { name: "Calabresa", size: "large", price: 4500, quantity: 1 },
    { name: "Napolitana", size: "medium", price: 10000, quantity: 2 },
    { name: "Napolitana", size: "large", price: 14000, quantity: 2 },
    { name: "Napolitana", size: "small", price: 6000, quantity: 3 },
    { name: "Vegetariana", size: "small", price: 3000, quantity: 2 },
    { name: "Vegetariana", size: "medium", price: 6000, quantity: 3 },
    { name: "Vegetariana", size: "medium", price: 8000, quantity: 4 },
    { name: "Vegetariana", size: "large", price: 3500, quantity: 1 },
    { name: "Jamon y morrones", size: "small", price: 5000, quantity: 2 },
    { name: "Jamon y morrones", size: "large", price: 8000, quantity: 2 },
    { name: "Jamon y morrones", size: "medium", price: 6000, quantity: 2 },
    { name: "Jamon y morrones", size: "small", price: 7500, quantity: 3 },
    { name: "Napolitana", size: "medium", price: 15000, quantity: 3 }
])*/

//Middlewares

app.use(express.json())
app.use(cookieParser(varenv.cookies_secret))
app.engine('handlebars', engine({
    extname: '.handlebars',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');



app.use(session({
    secret: varenv.session_secret,
    resave: true,
    store: MongoStore.create({
        mongoUrl: varenv.mongo_url,
        ttl: 60 * 60
    }),
    saveUninitialized: true
}))

initializePassport()
app.use(passport.initialize())
app.use(passport.session())

app.post('/login', (req, res) => {
    const {email, password} = req.body

    if(email == "admin@admin.com" && password == "1234") {
        req.session.email = email
        req.session.password = password
        return res.send("Login")
    }
    res.send("Login invalido")
})

//Routes

app.use('/', indexRouter)

//Cookies Routes

app.set('/setCookies', (req, res) => {
    res.cookie('cookieCookie', 'Esto es una cookie', {maxAge: 3000000, signed: true}).send(("Cookie creada"))
})
app.get('/getCookies', (req, res) => {
    res.send(req.signedCookies)
})
app.get('/deleteCookie', (req, res) => {
    res.clearCookie('cookieCookie').send("Cookie eliminadad")
    //res.cookie('cookieCookie', '', {expires: new Date(0)})
})

//Sesion Routes

app.get('/session', (req, res) => {
    if(req.session.counter) {
        req.session.counter++
        res.send(`Sos el usuario n° ${req.session.counter}`)
    } else {
        req.session.counter = 1
        res.send("Sos el primer usuario que ingresa a la pagina")
    }
})
io.on('connection', (socket) => {
    console.log(`Conexion con Socket.io`)

    socket.on('mensaje', async (mensaje) => {
        try {
            await messageModel.create(mensaje)
            const mensajes = await messageModel.find()
            io.emit('mensajeLogs', mensajes)
        } catch (e) {
            io.emit('mensajeLogs', e)
        }

    })
})


//Routes
/*app.get('/', (req, res) => {
    // Define la variable css con el nombre del archivo CSS que deseas incluir
    const cssFile = 'home.css';
    // Renderiza la vista main.handlebars y pasa la variable css
    res.render('main', { css: cssFile });
});*/



/*
app.get('/static', (req, res) => {

    const prods = [
        {id: 1, title: `Celular`, price: 1500, img: ""},
        {id: 1, title: `Televisor`, price: 2500, img: ""},
        {id: 1, title: `Notebook`, price: 1700, img: ""},
        {id: 1, title: `Tablet`, price: 6200, img: ""}
    ]
    res.render('templates/products', {
        mostrarProductos: true,
        productos: prods,
        css: 'product.css'
    })
})
*/

