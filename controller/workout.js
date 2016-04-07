function isAuthenticated(e, t, o) {
    e.session.loggeduser || e.user ? o() : (e.session.error = "Access denied!", t.redirect("/"))
}

function arraySearch(e, t) {
    for (var o = 0; o < e.length; o++)
        if (e[o].exercise_id === t) return o;
    return !1
}
var express = require("express"),
    router = express.Router(),
    WorkoutHistory = require("../model/workout_history.js"),
    Workout = require("../model/workout.js"),
    Exercise = require("../model/exercise.js"),
    Reporting = require("../model/reporting.js"),
    User = require("../model/user.js"),
    UserActivity = require("../model/activity.js"),
    WorkoutDetails = require("../model/workoutdetails.js"),
    multipart = require("connect-multiparty"),
    multipartMiddleware = multipart(),
    fs = require("fs"),
    captcha = require("easy-captcha"),
    array = require("array-extended"),
    request = require("request"),
    q = require("promised-io/promise"),
    findOne = function(e, t) {
        var o = q.defer();
        return e.findOne(t, function(e, t) {
            t ? o.resolve(t) : o.reject(e)
        }), o
    },
    findAllQ = function(e, t, o, r) {
        var i = q.defer();
        return e.find(t, o, r, function(e, t) {
            t ? i.resolve(t) : i.reject(e)
        }), i
    },
    findOneQ = function(e, t, o, r) {
        var i = q.defer();
        return e.findOne(t, function(e, t) {
            t ? i.resolve({
                workoutid: o.workoutid,
                name: o.name,
                difficulty: o.difficulty,
                number_of_days: o.number_of_days,
                workout_length: o.workout_length,
                description: o.description,
                tags: o.tags,
                w_exercise_id: o.w_exercise_id,
                created_by: o.created_by,
                workout_image: o.workout_image,
                status: o.status,
                shared_to_list: o.shared_to_list,
                shared_to: o.shared_to,
                ownername: t.name,
                ownerid: t.vendorid
            }) : i.reject(e)
        }), i
    };
module.exports = function(e) {
    function t(e, t, o, r) {
        var i = e,
            d = "";
        "shared_privately" == t && (d = "Workout " + r + " shared privately!!");
        var s = i.created_by && "" != i.created_by ? i.created_by : i.vendorid,
            n = new UserActivity({
                vendorid: i.vendorid,
                user_name: i.name,
                activity_desc: d,
                act_area: t,
                parentid: s,
                receiverid: o,
                workout_name: r
            });
        n.save(function(e) {})
    }
    router.get("/", isAuthenticated, function(e, t) {
        t.render("workout/index.ejs", {
            title: "GymCue List"
        })
    }), router.get("/history", isAuthenticated, function(e, t) {
        t.render("workout/history.ejs", {
            title: "GymCue history"
        })
    }), router.post("/getexercise", isAuthenticated, function(e, t) {
        var o = e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                if ("1" != e.body.data.exerciseid) var r = {
                    vendorid: o.vendorid,
                    status: {
                        $in: ["public", "private"]
                    },
                    exerciseid: {
                        $ne: e.body.data.exerciseid
                    }
                };
                else {
                    var r = "";
                    r = "athlete" != o.user_type || "0" != o.created_by && "undefined" != typeof o.created_by ? "athlete" != o.user_type || "0" == o.created_by && "undefined" == typeof o.created_by ? {
                        $or: [{
                            vendorid: o.vendorid,
                            status: {
                                $ne: "draft"
                            }
                        }, {
                            status: "public"
                        }]
                    } : {
                        $or: [{
                            vendorid: o.created_by
                        }],
                        status: {
                            $ne: "draft"
                        }
                    } : {
                        $or: [{
                            vendorid: o.vendorid
                        }, {
                            status: "public"
                        }]
                    }
                }
                var i = [];
                findAllQ(Exercise.Exercise, r, {}, {
                    sort: {
                        name: 1
                    }
                }).then(function(e) {
                    if (e.length > 0) {
                        var o = 0;
                        return e.forEach(function(e) {
                            "Rest" != e.name ? i.push(e) : o = e
                        }), q.all(i).then(function(e) {
                            e.splice(0, 0, o);
                            var r = e;
                            t.send(200, r)
                        })
                    }
                    t.send(200, "No_activity")
                }, function(e) {
                    t.send(200, "")
                })
            }
        })
    }), router.post("/getexercise_details", isAuthenticated, function(e, t) {
        e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                var o = {
                    exerciseid: e.body.data.exerciseid
                };
                Exercise.Exercise.findOne(o, function(e, o) {
                    t.send(200, o)
                })
            }
        })
    }), router.get("/getallatheletes", isAuthenticated, function(e, t) {
        var o = e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                User.User.find({
                    created_by: o.vendorid
                }, function(e, o) {
                    t.send(200, o)
                })
            }
        })
    }), router.get("/gethistory", isAuthenticated, function(e, t) {
        var o = e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                var e = "";
                e = "athlete" == o.user_type ? {
                    athletid: o.vendorid
                } : {
                    $or: [{
                        athletid: o.vendorid
                    }, {
                        coachid: o.vendorid
                    }]
                }, WorkoutHistory.WorkoutHistory.find(e, function(e, o) {
                    var r = [],
                        i = o.length;
                    i > 0 ? o.forEach(function(e) {
                        Workout.Workout.findOne({
                            workoutid: e.workoutid
                        }, function(o, d) {
                            if (null != d) {
                                var s = e.created_at.toISOString().split("T");
                                s[1].toString().split(".");
                                r.push({
                                    workoutid: e.workoutid,
                                    whid: e.whid,
                                    name: d.name,
                                    day_done: e.day_done,
                                    created_at: s[0],
                                    detailsid: e.detailsid
                                })
                            } else r.push({
                                workoutid: e.workoutid,
                                whid: e.whid,
                                name: "",
                                day_done: e.day_done,
                                created_at: "",
                                detailsid: e.detailsid
                            });
                            --i || t.send(200, r)
                        })
                    }) : t.send(200, "no_record")
                })
            }
        })
    }), router.get("/getworkouts", isAuthenticated, function(e, t) {
        var o = e.session.loggeduser || e.user,
            r = [];
        t.format({
            "application/json": function() {
                var e = "";
                e = "athlete" != o.user_type || "0" != o.created_by && "undefined" != typeof o.created_by ? "athlete" != o.user_type || "0" == o.created_by && "undefined" == typeof o.created_by ? {
                    $or: [{
                        status: {
                            $in: ["public"]
                        }
                    }, {
                        created_by: o.vendorid
                    }]
                } : {
                    $or: [{
                        status: "public"
                    }, {
                        status: "private",
                        shared_to_list: {
                            $in: [o.vendorid]
                        }
                    }]
                } : {
                    $or: [{
                        created_by: o.vendorid
                    }, {
                        status: "public"
                    }]
                }, findAllQ(Workout.Workout, e, {}, {
                    sort: {
                        name: 1
                    }
                }).then(function(e) {
                    return e.length > 0 ? (e.forEach(function(e) {
                        r.push(findOneQ(User.User, {
                            vendorid: e.created_by
                        }, e, o))
                    }), q.all(r).then(function(e) {
                        t.send(200, e)
                    })) : void t.send(200, "No_activity")
                }, function(e) {
                    t.send(200, "")
                })
            }
        })
    }), router.get("/getpreviousdetails", isAuthenticated, function(e, t) {
        var o = e.session.loggeduser || e.user,
            r = "";
        r = "athlete" == o.user_type ? {
            athleteid: o.vendorid
        } : {
            $or: [{
                athleteid: o.vendorid
            }, {
                coachid: o.vendorid
            }]
        }, WorkoutHistory.WorkoutHistory.find(r, {
            workout_name: 1,
            workoutid: 1,
            detailsid: 1,
            whid: 1,
            day_done: 1
        }, function(e, o) {
            t.send(200, o)
        })
    }), router.post("/create", function(e, t) {
        var o = e.session.loggeduser || e.user;
        if ("athlete" == o.user_type && 0 == o.created_by) var r = "private";
        else var r = "draft";
        Workout.Workout.findOne({
            name: e.body.name,
            status: {
                $in: ["public", "draft"]
            }
        }, function(i, d) {
            if (d) t.send(200, "already_exists");
            else {
                var s = Workout.randomValueBase64(7),
                    n = new Workout.Workout({
                        workoutid: s,
                        name: e.body.name,
                        difficulty: e.body.difficulty,
                        number_of_days: e.body.number_of_days,
                        workout_length: e.body.workout_length,
                        description: e.body.description,
                        tags: e.body.tags,
                        w_exercise_id: e.body.w_exercise_id,
                        created_by: o.vendorid,
                        workout_image: e.body.workout_image,
                        status: r
                    });
                n.save(function(o) {
                    if (o) return t.send(500, o);
                    var r = {
                        numberofDays: e.body.number_of_days,
                        workout_name: e.body.name,
                        exercise_linked: e.body.w_exercise_id,
                        workout_id: s
                    };
                    t.send(JSON.stringify(r))
                })
            }
        })
    }), router.get("/workout_detail/:workoutid", function(e, t) {
        t.format({
            "application/json": function() {
                if (e.session.loggeduser || e.user) {
                    e.session.loggeduser ? e.session.loggeduser : e.user;
                    if ("undefined" != typeof e.params.workoutid && "default" != e.params.workoutid && "" != e.params.workoutid) var o = {
                        workoutid: e.params.workoutid
                    };
                    Workout.Workout.findOne(o, function(e, o) {
                        o ? t.send(200, o) : t.send(200, "")
                    })
                }
            }
        })
    }), router.get("/get_workout_exercise/:workoutid/:days_count", function(e, t) {
        t.format({
            "application/json": function() {
                WorkoutDetails.WorkoutDetails.findOne({
                    workoutid: e.params.workoutid,
                    numberofdays: e.params.days_count
                }, {
                    exercise_linked: 1,
                    _id: 0
                }, function(o, r) {
                    if (null != r) {
                        var i = [];
                        if ("undefined" != typeof r && null != r && r.exercise_linked.length >= 1) {
                            var d = array.unique(r.exercise_linked),
                                s = d.length;
                            d.forEach(function(o) {
                                Exercise.Exercise.findOne({
                                    exerciseid: o
                                }, function(o, r) {
                                    i.push({
                                        workoutid: e.params.workoutid,
                                        exercise_id: r.exerciseid,
                                        exercise_name: r.name
                                    }), --s || t.send(200, i)
                                })
                            })
                        }
                    } else t.send(200, "no_record")
                })
            }
        })
    }), router.get("/get_not_assigned_exercise/:workoutid", function(e, t) {
        t.format({
            "application/json": function() {
                Workout.Workout.findOne({
                    workoutid: e.params.workoutid
                }, {
                    w_exercise_id: 1,
                    _id: 0
                }, function(o, r) {
                    var i = [];
                    Exercise.Exercise.find({
                        exerciseid: {
                            $nin: r.w_exercise_id
                        },
                        status: {
                            $in: ["public", "private"]
                        }
                    }, function(o, r) {
                        var d = r.length;
                        r.forEach(function(o) {
                            i.push({
                                workoutid: e.params.workoutid,
                                exercise_id: o.exerciseid,
                                exercise_name: o.name
                            }), --d || t.send(200, i)
                        })
                    })
                })
            }
        })
    }), router.post("/workout_builder_detail", function(e, t) {
        var o = [];
        t.format({
            "application/json": function() {
                if (e.session.loggeduser || e.user) {
                    var r;
                    e.session.loggeduser ? e.session.loggeduser : e.user;
                    r = "" !== e.body.data.days_count ? {
                        workoutid: e.body.data.workoutid,
                        numberofdays: e.body.data.days_count
                    } : {
                        workoutid: e.body.data.workoutid
                    }, findOne(WorkoutDetails.WorkoutDetails, r).then(function(e) {
                        return e.exercise_linked.forEach(function(e) {
                            o.push(findOne(Exercise.Exercise, {
                                exerciseid: e
                            }))
                        }), q.all(o).then(function(t) {
                            return t.map(function(o) {
                                return {
                                    exercise_name: o.name,
                                    exercise_id: o.exerciseid,
                                    wd_exd: e.workout_details[t.indexOf(o)]
                                }
                            })
                        }).then(function(o) {
                            wp_list = [{
                                detailsid: e.detailsid,
                                moredetail: e.workout_details,
                                numberofdays: e.numberofdays,
                                rest_details: e.rest_details,
                                exerciselinked: e.exercise_linked,
                                wd_details: o
                            }], t.send(200, wp_list)
                        })
                    }, function(e) {
                        t.send(200, "")
                    })
                }
            }
        })
    }), router.post("/getwb_days/", function(e, t) {
        Workout.Workout.findOne({
            workoutid: e.body.data.workoutid
        }, {
            number_of_days: 1,
            _id: 0
        }, function(e, o) {
            o && t.send(200, o.number_of_days)
        })
    }), router.post("/editworkout", function(e, t) {
        Workout.Workout.update({
            workoutid: e.body.workoutid
        }, {
            $set: {
                name: e.body.name,
                difficulty: e.body.difficulty,
                number_of_days: e.body.number_of_days,
                workout_length: e.body.workout_length,
                description: e.body.description,
                tags: e.body.tags
            }
        }, function(e, o) {
            o && t.send(200, "updated")
        })
    }), router.post("/upload-workout-form", multipartMiddleware, function(e, t) {
        t.setHeader("Content-Type", "text/html");
        var o = (e.session.loggeduser ? e.session.loggeduser : e.user, ""),
            r = "",
            i = ["jpeg", "jpg", "gif", "png", "bmp"];
        if (e.files.profile_pics && e.files.profile_pics.size > 0) {
            var d = "";
            "image/jpeg" == e.files.profile_pics.type && (d = "jpeg"), "image/gif" == e.files.profile_pics.type && (d = "gif"), "image/png" == e.files.profile_pics.type && (d = "png"), "image/bmp" == e.files.profile_pics.type && (d = "bmp");
            var s = i.indexOf(d);
            if (s >= 0) {
                e.files.profile_pics;
                fs.readFile(e.files.profile_pics.path, function(i, s) {
                    var n = (e.files.profile_pics.name, Date.now() + "." + d),
                        a = "./public/pictures/workout/" + n;
                    fs.writeFile(a, s, function(i) {
                        Workout.Workout.update({
                            workoutid: e.body.workoutid
                        }, {
                            $set: {
                                workout_image: n
                            }
                        }, function(e) {
                            if (e) r = "No file uploaded at " + (new Date).toString(), t.send(r);
                            else {
                                o = n;
                                var i = {
                                    pictureUrlExercise: n
                                };
                                t.send(JSON.stringify(i))
                            }
                        })
                    })
                })
            } else r = "Not_Valid_Img", t.send(r)
        } else r = "Not_Updated", t.send(r)
    });
    var o = function(e) {
        var t = [];
        for (var o in e) t.push([o, e[o]].join("="));
        return t.join("&")
    };
    return router.post("/recaptcha_check", function(e, t) {
        request({
            method: "POST",
            url: "http://www.google.com/recaptcha/api/verify",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: o({
                privatekey: "<key>",
                remoteip: "<ip>",
                challenge: e.body.challenge,
                response: e.body.response
            })
        }, function(e, o, r) {
            t.status(200).send({
                resp: r.split(/\n/)
            })
        })
    }), router.post("/report_workout", function(e, t, o) {
        var r = e.session.loggeduser ? e.session.loggeduser : e.user;
        User.User.findOne({
            vendorid: e.body.ownerid
        }, function(o, i) {
            var d = new Reporting.Reporting({
                reportid: Reporting.randomValueBase64(7),
                report_description: e.body.report_description,
                reported_for_id: e.body.reported_for_id,
                type: "workout",
                reported_by: r.vendorid
            });
            d.save(function(o) {
                return o ? t.send(500, o) : void t.mailer.send("email/report.ejs", {
                    to: i.email,
                    subject: "Workout Reported",
                    mail_text: e.body.report_description,
                    ownername: i.name,
                    reported_by: r.name,
                    workout_name: e.body.workout_name,
                    otherProperty: {
                        mail_text: e.body.report_description,
                        ownername: i.name,
                        reported_by: r.name,
                        workout_name: e.body.workout_name
                    }
                }, function(e) {
                    return e ? void t.send("There was an error sending the email") : void t.send(200, "reported")
                })
            })
        })
    }), router.post("/editmoredetails", function(e, t) {
        var o = (e.session.loggeduser ? e.session.loggeduser : e.user, {
            workout_details: e.body.more_detail,
            rest_details: e.body.rest_details,
            workoutid: e.body.workout_id,
            numberofdays: e.body.numberofdays,
            exercise_linked: e.body.exercise_linked,
            status: "draft"
        });
        WorkoutDetails.WorkoutDetails.update({
            workoutid: e.body.workout_id,
            detailsid: e.body.detailsid
        }, {
            $set: o
        }, {
            multi: !0
        }, function(e, o) {
            e ? t.send(500, "record not updated") : t.send(200, "record updated")
        })
    }), router.post("/addmoredetails", function(e, t) {
        var o = e.session.loggeduser ? e.session.loggeduser : e.user;
        if ("athlete" == o.user_type && 0 == o.created_by) var r = "private";
        else var r = "draft";
        if (e.body.numberofdays > 0) {
            var i = WorkoutDetails.randomValueBase64(7);
            WorkoutDetails.WorkoutDetails.findOne({
                workoutid: e.body.workout_id,
                numberofdays: e.body.numberofdays
            }, function(d, s) {
                if (s) t.send(200, "already_added");
                else {
                    var n = new WorkoutDetails.WorkoutDetails({
                        detailsid: i,
                        workout_details: e.body.more_detail,
                        rest_details: e.body.rest_detail,
                        workoutid: e.body.workout_id,
                        numberofdays: e.body.numberofdays,
                        exercise_linked: e.body.exercise_linked,
                        created_by: o.vendorid,
                        status: r
                    });
                    n.save(function(e) {
                        e ? t.send(200, e) : t.send(200, "added")
                    })
                }
            })
        } else t.send(200, "numberofday")
    }), router.post("/associate_more_details", function(e, t) {
        var o = e.session.loggeduser ? e.session.loggeduser : e.user,
            r = WorkoutDetails.randomValueBase64(7);
        WorkoutDetails.WorkoutDetails.findOne({
            workoutid: e.body.workout_id,
            numberofdays: e.body.numberofdays
        }, function(i, d) {
            if (d) WorkoutDetails.WorkoutDetails.update({
                workoutid: e.body.workout_id,
                numberofdays: e.body.numberofdays
            }, {
                $push: {
                    workout_details: {
                        $each: e.body.more_detail
                    },
                    exercise_linked: {
                        $each: e.body.exercise_linked
                    },
                    rest_details: {
                        $each: e.body.rest_detail
                    }
                }
            }, function(e, o) {
                o ? t.send(200, "updated") : t.send(200, "not updated")
            });
            else {
                var s = new WorkoutDetails.WorkoutDetails({
                    detailsid: r,
                    workout_details: e.body.more_detail,
                    rest_details: e.body.rest_detail,
                    workoutid: e.body.workout_id,
                    numberofdays: e.body.numberofdays,
                    exercise_linked: e.body.exercise_linked,
                    created_by: o.vendorid,
                    status: "draft"
                });
                s.save(function(e) {
                    e ? t.send(200, "not updated") : t.send(200, "updated")
                })
            }
        })
    }), router.post("/changestatus", function(e, t) {
        Workout.Workout.update({
            workoutid: e.body.data.workoutid
        }, {
            $set: {
                status: "public",
                shared_to_list: "",
                shared_to: ""
            }
        }, function(o, r) {
            WorkoutDetails.WorkoutDetails.update({
                workoutid: e.body.data.workoutid
            }, {
                $set: {
                    status: "public"
                }
            }, {
                multi: !0
            }, function(e, o) {
                e ? t.send(500, "status not updated") : t.send(200, "status updated")
            })
        })
    }), router.post("/share_private_form", function(e, o) {
        var r = e.session.loggeduser ? e.session.loggeduser : e.user,
            i = "",
            d = "";
        "all" == e.body.to_clients && (i = "all", d = e.body.clients_list_all), "not_all" == e.body.to_clients && (i = "specific", d = e.body.clients_list);
        for (var s = 0; s < d.length; s++) t(r, "shared_privately", d[s], e.body.workout_name);
        Workout.Workout.update({
            workoutid: e.body.workoutid
        }, {
            $set: {
                status: "private",
                shared_to: i,
                shared_to_list: d
            }
        }, function(t, r) {
            WorkoutDetails.WorkoutDetails.update({
                workoutid: e.body.workoutid
            }, {
                $set: {
                    status: "private"
                }
            }, {
                multi: !0
            }, function(e, t) {
                e ? o.send(500, "status not updated") : o.send(200, "status updated")
            })
        })
    }), router.get("/delworkout/:wid", isAuthenticated, function(e, t) {
        e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                WorkoutDetails.WorkoutDetails.remove({
                    workoutid: e.params.wid
                }, function(o, r) {
                    Workout.Workout.remove({
                        workoutid: e.params.wid
                    }, function(e, o) {
                        t.send(200, o)
                    })
                })
            }
        })
    }), router.get("/delworkouthistory/:wid", isAuthenticated, function(e, t) {
        e.session.loggeduser || e.user;
        t.format({
            "application/json": function() {
                WorkoutHistory.WorkoutHistory.remove({
                    whid: e.params.wid
                }, function(e, o) {
                    t.send(200, o)
                })
            }
        })
    }), router.get("/getdetails_history/:detailsid/:whid", isAuthenticated, function(e, t) {
        t.format({
            "application/json": function() {
                WorkoutHistory.WorkoutHistory.findOne({
                    whid: e.params.whid,
                    detailsid: e.params.detailsid
                }, function(e, o) {
                    var r = [],
                        i = [],
                        d = 0,
                        s = o.exercise_linked.length,
                        n = [];
                    o.exercise_linked.forEach(function(e) {
                        n.push(e), Exercise.Exercise.findOne({
                            exerciseid: e
                        }, function(a, u) {
                            var c = o.exercise_linked.indexOf(e);
                            r[c] = u.name, o.exercise_linked[c] = Date.now(), d++, --s || (i.push({
                                workout_name: o.workout_name,
                                whid: o.whid,
                                detailsid: o.detailsid,
                                workout_detail: o.workout_details,
                                day_done: o.day_done,
                                exercise_linked: n,
                                rest_details: o.rest_details,
                                exercise_name: r
                            }), t.send(200, i))
                        })
                    })
                })
            }
        })
    }), router.post("/edithistorydetails", isAuthenticated, function(e, t) {
        WorkoutHistory.WorkoutHistory.update({
            whid: e.body.whid
        }, {
            $set: {
                workout_details: e.body.workout_detail,
                rest_details: e.body.rest_details
            }
        }, function(e, o) {
            o ? t.send(200, "record_updated") : t.send(200, "record_not_updated")
        })
    }), router
};
