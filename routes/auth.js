const router = require('express').Router();
const User = require('../model/User');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
    // data validation 
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // check database
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist) return res.status(400).send('Email já cadastrado');

    // hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // create new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    try{
        const savedUser = await user.save();
        res.send({user: user._id});
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login
router.post('/login', async (req,res) => {
    // data validation 
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);
        // verifica email
        const user = await User.findOne({email: req.body.email});
        if (!user) return res.status(400).send('Wrong email or password');
        // verifica senha 
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if(!validPass) return res.status(400).send('Invalid PW')

        //token
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
        res.header('auth-token', token).send(token);
});

module.exports = router;