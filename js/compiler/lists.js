const reporters = [
	"motion_xposition", 
	"motion_yposition", 
	"motion_direction", 
	"looks_size", 
	"sound_volume", 
	"sensing_distanceto", 
	"sensing_mousex", 
	"sensing_mousey", 
	"sensing_loudness", 
	"sensing_timer", 
	"sensing_current", 
	"sensing_dayssince2000", 
	"operator_add", 
	"operator_subtract", 
	"operator_multiply", 
	"operator_divide", 
	"operator_random",
	"operator_length", 
	"operator_mod", 
	"operator_round", 
	"operator_mathop", 
	"data_itemnumoflist", 
	"data_lengthoflist", 
	"music_getTempo", 
	"videoSensing_videoOn", 
	"microbit_getTiltAngle", 
	"ev3_getMotorPosition", 
	"ev3_getDistance", 
	"ev3_getBrightness", 
	"boost_getMotorPosition", 
	"boost_getTiltAngle", 
	"wedo2_getDistance", 
	"wedo2_getTiltAngle", 
	"gdxfor_getForce", 
	"gdxfor_getTilt", 
	"gdxfor_getSpinSpeed", 
	"gdxfor_getAcceleration", 
	"control_get_counter", 
	"xpos", 
	"ypos", 
	"heading", 
	"costumeIndex", 
	"backgroundIndex", 
	"scale", 
	"volume", 
	"tempo", 
	"distanceTo:", 
	"mouseX", 
	"mouseY", 
	"soundLevel", 
	"senseVideoMotion", 
	"timer", 
	"timeAndDate", 
	"timestamp", 
	"+", 
	"-", 
	"*", 
	"/", 
	"randomFrom:to:", 
	"stringLength:", 
	"%", 
	"rounded", 
	"computeFunction:of:", 
	"lineCountOfList:", 
	"COUNT", 
	"sensing_answer", 
	"sensing_username", 
	"operator_join", 
	"operator_letter_of", 
	"translate_getTranslate", 
	"translate_getViewerLanguage", 
	"motion_xscroll", 
	"motion_yscroll", 
	"sensing_userid", 
	"coreExample_exampleOpcode", 
	"data_listcontents", 
	"sceneName", 
	"answer", 
	"getUserName", 
	"concatenate:with:", 
	"letter:of:", 
	"contentsOfList:", 
	"getParam", 
	"xScroll", 
	"yScroll", 
	"getUserId", 
	"argument_reporter_string_number", 
	"sensing_touchingobject", 
	"sensing_touchingcolor", 
	"sensing_coloristouchingcolor", 
	"sensing_keypressed", 
	"sensing_mousedown", 
	"operator_gt", 
	"operator_lt", 
	"operator_equals", 
	"operator_and", 
	"operator_or", 
	"operator_not", 
	"operator_contains", 
	"data_listcontainsitem", 
	"argument_reporter_boolean", 
	"microbit_isButtonPressed", 
	"microbit_isTilted", 
	"ev3_buttonPressed", 
	"boost_seeingColor", 
	"wedo2_isTilted", 
	"gdxfor_isTilted", 
	"gdxfor_isFreeFalling", 
	"sensing_loud", 
	"touching:", 
	"touchingColor:", 
	"color:sees:", 
	"keyPressed:", 
	"mousePressed", 
	"<", 
	"=", 
	">", 
	"&", 
	"|", 
	"not", 
	"list:contains:", 
	"isLoud", 
	"looks_costumenumbername", 
	"looks_backdropnumbername", 
	"sensing_of", 
	"getAttribute:of:", 
	"data_variable", 
	"readVariable", 
	"data_itemoflist", 
	"getLine:ofList:"
];

const menus = [
	"motion_goto_menu",
	"motion_glideto_menu",
	"motion_pointtowards_menu",
	"looks_costume",
	"looks_backdrops",
	"sound_sounds_menu",
	"event_broadcast_menu",
	"control_create_clone_of_menu",
	"sensing_touchingobjectmenu",
	"sensing_distancetomenu",
	"sensing_keyoptions",
	"sensing_of_object_menu",
	"music_menu_DRUM",
	"music_menu_INSTRUMENT",
	"pen_menu_colorParam",
	"videoSensing_menu_ATTRIBUTE",
	"videoSensing_menu_SUBJECT",
	"videoSensing_menu_VIDEO_STATE",
	"text2speech_menu_voices",
	"text2speech_menu_languages",
	"translate_menu_languages",
	"makeymakey_menu_KEY",
	"makeymakey_menu_SEQUENCE",
	"microbit_menu_buttons",
	"microbit_menu_gestures",
	"microbit_menu_tiltDirectionAny",
	"microbit_menu_tiltDirection",
	"microbit_menu_touchPins",
	"ev3_menu_motorPorts",
	"ev3_menu_sensorPorts",
	"boost_menu_MOTOR_ID",
	"boost_menu_MOTOR_DIRECTION",
	"boost_menu_MOTOR_REPORTER_ID",
	"boost_menu_COLOR",
	"boost_menu_TILT_DIRECTION_ANY",
	"boost_menu_TILT_DIRECTION",
	"wedo2_menu_MOTOR_ID",
	"wedo2_menu_MOTOR_DIRECTION",
	"wedo2_menu_OP",
	"wedo2_menu_TILT_DIRECTION_ANY",
	"wedo2_menu_TILT_DIRECTION",
	"gdxfor_menu_gestureOptions",
	"gdxfor_menu_pushPullOptions",
	"gdxfor_menu_tiltAnyOptions",
	"gdxfor_menu_tiltOptions",
	"gdxfor_menu_axisOptions",
	"event_touchingobjectmenu",
	"microbit_menu_pinState",
	"procedures_prototype",
	"argument_editor_boolean",
	"argument_editor_string_number",
	"note",
	"matrix"
];