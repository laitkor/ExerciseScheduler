function randomValueBase64(e) {
    return crypto.randomBytes(Math.ceil(3 * e / 4)).toString("base64").slice(0, e).replace(/\+/g, "0").replace(/\//g, "0")
}
var mongoose = require("mongoose"),
    crypto = require("crypto"),
    workout_schema = mongoose.Schema({
        id: Number,
        workoutid: String,
        name: String,
        difficulty: String,
        number_of_days: Number,
        workout_length: Number,
        description: String,
        tags: String,
        w_exercise_id: Array,
        created_by: String,
        status: String,
        shared_to_list: Array,
        shared_to: String,
        created_at: {
            type: Date,
            "default": Date.now
        },
        workout_image: String
    }),
    Workout = mongoose.model("Workout", workout_schema);
module.exports = {
    Workout: Workout,
    randomValueBase64: randomValueBase64
};