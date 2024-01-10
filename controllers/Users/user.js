
const router = require("express").Router();
const User = require('../../models/User.js');
const { errorHandler } = require('../../utils/error.js')



// user Details 
router.get('/myprofile', async (req, res, next) => {
    try {
        id = await req.user._id;
        const user = await User.findById(id);
        // const user = await User.findById(req.params.id);

        if (!user) return next(errorHandler(404, 'User not found!'));

        const { password, ...rest } = user._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
});


// User profile Update

router.put("/myprofile", async (req, res) => {
    try {
        const id = req.user._id; // getting user id form the jwt encryption

        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            photo: req.body.photo,
            resume: req.body.resume,
            year:req.body.year,
            Domain:req.body.Domain,
            admissionNumber: req.body.admissionNumber,
            phoneNumber: req.body.phoneNumber,
            socialLinks:req.body.socialLinks
        });

        if (updatedUser) {
            res.status(200).json({ success: true, message: "User profile updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "User profile not updated" });
    }
});


// user Deletion
router.get('/delete/:id', async (req, res, next) => {
    if (req.user._id !== req.params.id)
        return next(errorHandler(401, 'You can only delete your own account!'));
    try {
        await User.findByIdAndDelete(req.params.id);
        res.clearCookie('access_token');
        res.status(200).json('User has been deleted!');
    } catch (error) {
        next(error);
    }
});
module.exports = router;