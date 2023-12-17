const express = require('express');
const app = express()
const multer = require('multer')
const path = require('path');
const moment = require('moment');
const uploader = multer({
    storage: multer.diskStorage({ // 저장한공간 정보 : 하드디스크에 저장
        destination(req, file, done) { // 저장 위치
            done(null, './views/upload'); // upload라는 폴더 안에 저장
        },
        filename(req, file, done) { // 파일명을 어떤 이름으로 올릴지
            const ext = path.extname(file.originalname); // 파일의 확장자
            done(null, path.basename(file.originalname, ext) + Date.now() + ext); // 파일이름 + 날짜 + 확장자 이름으로 저장
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 } // 5메가로 용량 제한
});
const user = require('./module/user.js')
const crypto = require("crypto");
const fs = require('fs');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.json());
app.use(express.static('views'));


app.get('/', async (req, res) => {
    let { token } = req.query
    let { check } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let users = await user.GetToken(token)

    if(users === 'Not Found' || users === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let expiration_date = moment(users.Token_data[0].expiration_date) // 만료 일자
    let date = moment(users.Token_data[0].date) // 등록 일자
    let remaining = expiration_date.diff(date, 'days') // 남은 일자
    
    if(remaining <= 0) {
        return res.json({
            ok: false,
            message: "만료 되었습니다, 연장 해주세요"
        })
    }

    if(check != undefined) { // 남은 일수 체크
        return res.render('check', {
            name: users.Token_data[0].name, // 이름
            expiration_date: users.Token_data[0].expiration_date, // 만료 일자
            date: users.Token_data[0].date, // 등록 일자
            remaining: remaining // 남은 일자
        })
    }

    res.render('main', {
        img_link: users.Token_data[0].img_link, // 민증사진
        name: users.Token_data[0].name, // 이름
        registration: users.Token_data[0].registration, // 민증번호
        address: users.Token_data[0].address, // 주소
        Date_created: users.Token_data[0].Date_created, // 민증 발급 날짜
        area: users.Token_data[0].area, // 발급 지역
	    token: token, // 토큰
    })
})

app.get('/admin', async (req, res) => { //위조민증 관리
    let { token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let User_data = await user.AdminGetUser(token)


    if(is_available.Token_data[0].role == 'admin') {
        let Admin_Data = await user.AdminData()
        return res.render('admin', { 
            token,
            User_data,
            admin: true,
            data: Admin_Data.data
        })
    }

    return res.render('admin', { 
        token,
        User_data,
        admin: false
    })
})

app.get('/edit', async (req, res) => { //위조민증 관리
    let { token } = req.query
    let { user_token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let users = await user.GetToken(user_token)

    res.render('edit', { 
        token,
        users
    })
})

app.get('/create', async (req, res) => { //위조민증 제조
    let { token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    res.render('create', { 
        token
    })
})

var getFields = multer();
app.post('/api/:type', getFields.any(), async (req, res) => {
    let { type } = req.params

    if(type === 'admin_create') {
        let { id } = req.body
        let { token } = req.body
        let { role } = req.body
        let { admin_token } = req.body
    
        if(!admin_token) {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }
    
        let is_available = await user.CreateTokenAvailable(admin_token)
    
    
        if(is_available === 'Not Found' || is_available.Token_data[0].role != 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }
    
        let CreateAdmin = await user.CreateAdmin(token, id, role)
        if(CreateAdmin != true) return res.json({ ok: false, message: "총판을 만드는데 실패했습니다"})
        return res.json({
            ok: true,
            message: "총판을 만드는데 성공했습니다"
        })
    }

    if(type === 'admin_noticeSave') {
        let { admin_token } = req.body
        let { textarea } = req.body 
    
        if(!admin_token) {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }
    
        let is_available = await user.CreateTokenAvailable(admin_token)
    
    
        if(is_available === 'Not Found' || is_available.Token_data[0].role != 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }

        let NoticeSave = await user.NoticeSave(textarea)
        if(NoticeSave != true) return res.json({ ok: false, message: "공지 저장에 실패했습니다"})
        return res.json({ 
            ok: true, 
            message: "공지 저장에 성공했습니다"
        })
    }

    if(type === 'delete') {
        let { admin_token } = req.body
        let { token } = req.body
    
        if(!admin_token) {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }
    
        let is_available = await user.CreateTokenAvailable(admin_token)
    
    
        if(is_available === 'Not Found') {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }
    
        if(req.body.type === 'Admin') {
            if(is_available.Token_data[0].role != 'admin') return res.json({ ok: false, message: '총관리자 권한이 없습니다'})
            let DeleteAdmin = await user.DeleteAdmin(token)
            if(DeleteAdmin.success === false) return res.json({ ok:false, message: '알 수없는 이유로 총판 삭제에 실패했습니다'})
            return res.json({
                ok: true,
                message: '총판을 성공적으로 제거했습니다'
            })
        }
    
        if(req.body.type === 'User') {
            let DeleteUser = await user.DeleteUser(token)
            if(DeleteUser.success === false) return res.json({ ok:false, message: '알 수없는 이유로 유저 삭제에 실패했습니다'})
            fs.unlinkSync(`./views/${DeleteUser.data[0].img_link}`)
            return res.json({
                ok: true,
                message: '유저를 성공적으로 제거했습니다'
            })
        }
    }

    if(type === 'save') {
        let { admin_token } = req.body
        let { token } = req.body

        if(!admin_token) {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }

        let is_available = await user.CreateTokenAvailable(admin_token)

        if(is_available === 'Not Found') {
            return res.status(400).json({
                success: false,
                message: 'Not Found Token'
            })
        }

        const data = {
            name: req.body.name,
            registration: req.body.registration,
            address: req.body.address,
            area: req.body.area,
            Date_created: req.body.Date_created,
            expiration_date: req.body.expiration_date,
        }

        let EditUser = await user.EditUser(data, token)
        if(EditUser === true) {
            return res.render('success', {
                type: 'edit'
            })
        } else {
            return res.json({
                success: false,
                message: "수정에 실패했습니다"
            })
        }
    }
})

//사진 업로드
app.post('/upload', uploader.single('file'), async (req, res) => {
    let { name } = req.body
    let { registration } = req.body
    let { address } = req.body
    let { Date_created } = req.body
    let { area } = req.body
    let { filename } = req.file
    let { expiration } = req.body
    let expiration_token  = req.body.token
    let token = crypto.randomBytes(20).toString('hex')

    let is_available = await user.CreateTokenAvailable(expiration_token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }  

    let time = moment().format('YYYY-MM-DD') //현재 날짜
    let expiration_date = moment().add(Number(expiration), 'd').format('YYYY-MM-DD') //30 일 뒤 계산

    let CreateUser = await user.CreateUsers(expiration_token, token, name, registration, address, Date_created, area, `/upload/${filename}`, time, expiration_date)

    if(CreateUser === true) {
        return res.render('success', {
            type: 'create',
            url: `/?token=${token}`
        })
    } else {
        return res.json({
            ok: false,
            message: "알 수 없는 이유로 업로드에 실패했습니다"
        })
    }
})

app.listen(80, () => {
    console.log("80 port on")
})