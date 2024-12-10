//Contains info about every Scratch block.
//Will be used to remove all Scratch 2 blocks.
//From scratch-vm/src/serialization/sb2_specmap.js
const scratch2OpcodeMap = {
    'forward:': {
        opcode: 'motion_movesteps',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'STEPS',
            	defaultValue: null
            }
        ]
    },
    'turnRight:': {
        opcode: 'motion_turnright',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DEGREES',
                defaultValue: null
            }
        ]
    },
    'turnLeft:': {
        opcode: 'motion_turnleft',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DEGREES',
                defaultValue: null
            }
        ]
    },
    'heading:': {
        opcode: 'motion_pointindirection',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_angle',
                inputName: 'DIRECTION',
                defaultValue: null
            }
        ]
    },
    'pointTowards:': {
        opcode: 'motion_pointtowards',
        argMap: [
            {
                type: 'input',
                inputOp: 'motion_pointtowards_menu',
                inputName: 'TOWARDS',
                defaultValue: null
            }
        ]
    },
    'gotoX:y:': {
        opcode: 'motion_gotoxy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y',
                defaultValue: null
            }
        ]
    },
    'gotoSpriteOrMouse:': {
        opcode: 'motion_goto',
        argMap: [
            {
                type: 'input',
                inputOp: 'motion_goto_menu',
                inputName: 'TO',
                defaultValue: null
            }
        ]
    },
    'glideSecs:toX:y:elapsed:from:': {
        opcode: 'motion_glidesecstoxy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y',
                defaultValue: null
            }
        ]
    },
    'changeXposBy:': {
        opcode: 'motion_changexby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DX',
                defaultValue: null
            }
        ]
    },
    'xpos:': {
        opcode: 'motion_setx',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X',
                defaultValue: null
            }
        ]
    },
    'changeYposBy:': {
        opcode: 'motion_changeyby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DY',
                defaultValue: null
            }
        ]
    },
    'ypos:': {
        opcode: 'motion_sety',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y',
                defaultValue: null
            }
        ]
    },
    'bounceOffEdge': {
        opcode: 'motion_ifonedgebounce',
        argMap: [
        ]
    },
    'setRotationStyle': {
        opcode: 'motion_setrotationstyle',
        argMap: [
            {
                type: 'field',
                fieldName: 'STYLE',
                defaultValue: null
            }
        ]
    },
    'xpos': {
        opcode: 'motion_xposition',
        argMap: [
        ]
    },
    'ypos': {
        opcode: 'motion_yposition',
        argMap: [
        ]
    },
    'heading': {
        opcode: 'motion_direction',
        argMap: [
        ]
    },
    'scrollRight': {
        opcode: 'motion_scroll_right',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DISTANCE',
                defaultValue: null
            }
        ]
    },
    'scrollUp': {
        opcode: 'motion_scroll_up',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DISTANCE',
                defaultValue: null
            }
        ]
    },
    'scrollAlign': {
        opcode: 'motion_align_scene',
        argMap: [
            {
                type: 'field',
                fieldName: 'ALIGNMENT',
                defaultValue: null
            }
        ]
    },
    'xScroll': {
        opcode: 'motion_xscroll',
        argMap: [
        ]
    },
    'yScroll': {
        opcode: 'motion_yscroll',
        argMap: [
        ]
    },
    'say:duration:elapsed:from:': {
        opcode: 'looks_sayforsecs',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS',
                defaultValue: null
            }
        ]
    },
    'say:': {
        opcode: 'looks_say',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE',
                defaultValue: null
            }
        ]
    },
    'think:duration:elapsed:from:': {
        opcode: 'looks_thinkforsecs',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS',
                defaultValue: null
            }
        ]
    },
    'think:': {
        opcode: 'looks_think',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE',
                defaultValue: null
            }
        ]
    },
    'show': {
        opcode: 'looks_show',
        argMap: [
        ]
    },
    'hide': {
        opcode: 'looks_hide',
        argMap: [
        ]
    },
    'hideAll': {
        opcode: 'looks_hideallsprites',
        argMap: [
        ]
    },
    'lookLike:': {
        opcode: 'looks_switchcostumeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_costume',
                inputName: 'COSTUME',
                defaultValue: null
            }
        ]
    },
    'nextCostume': {
        opcode: 'looks_nextcostume',
        argMap: [
        ]
    },
    'startScene': {
        opcode: 'looks_switchbackdropto',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_backdrops',
                inputName: 'BACKDROP',
                defaultValue: null
            }
        ]
    },
    'changeGraphicEffect:by:': {
        opcode: 'looks_changeeffectby',
        argMap: [
            {
                type: 'field',
                fieldName: 'EFFECT',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'CHANGE',
                defaultValue: null
            }
        ]
    },
    'setGraphicEffect:to:': {
        opcode: 'looks_seteffectto',
        argMap: [
            {
                type: 'field',
                fieldName: 'EFFECT',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VALUE',
                defaultValue: null
            }
        ]
    },
    'filterReset': {
        opcode: 'looks_cleargraphiceffects',
        argMap: [
        ]
    },
    'changeSizeBy:': {
        opcode: 'looks_changesizeby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'CHANGE',
                defaultValue: null
            }
        ]
    },
    'setSizeTo:': {
        opcode: 'looks_setsizeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE',
                defaultValue: null
            }
        ]
    },
    'changeStretchBy:': {
        opcode: 'looks_changestretchby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'CHANGE',
                defaultValue: null
            }
        ]
    },
    'setStretchTo:': {
        opcode: 'looks_setstretchto',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'STRETCH',
                defaultValue: null
            }
        ]
    },
    'comeToFront': {
        opcode: 'looks_gotofrontback',
        argMap: [
        ]
    },
    'goBackByLayers:': {
        opcode: 'looks_goforwardbackwardlayers',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'NUM',
                defaultValue: null
            }
        ]
    },
    'costumeIndex': {
        opcode: 'looks_costumenumbername',
        argMap: [
        ]
    },
    'costumeName': {
        opcode: 'looks_costumenumbername',
        argMap: [
        ]
    },
    'sceneName': {
        opcode: 'looks_backdropnumbername',
        argMap: [
        ]
    },
    'scale': {
        opcode: 'looks_size',
        argMap: [
        ]
    },
    'startSceneAndWait': {
        opcode: 'looks_switchbackdroptoandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_backdrops',
                inputName: 'BACKDROP',
                defaultValue: null
            }
        ]
    },
    'nextScene': {
        opcode: 'looks_nextbackdrop',
        argMap: [
        ]
    },
    'backgroundIndex': {
        opcode: 'looks_backdropnumbername',
        argMap: [
        ]
    },
    'playSound:': {
        opcode: 'sound_play',
        argMap: [
            {
                type: 'input',
                inputOp: 'sound_sounds_menu',
                inputName: 'SOUND_MENU',
                defaultValue: null
            }
        ]
    },
    'doPlaySoundAndWait': {
        opcode: 'sound_playuntildone',
        argMap: [
            {
                type: 'input',
                inputOp: 'sound_sounds_menu',
                inputName: 'SOUND_MENU',
                defaultValue: null
            }
        ]
    },
    'stopAllSounds': {
        opcode: 'sound_stopallsounds',
        argMap: [
        ]
    },
    'playDrum': {
        opcode: 'music_playDrumForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'music_menu_DRUM',
                inputName: 'DRUM',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS',
                defaultValue: null
            }
        ]
    },
    'drum:duration:elapsed:from:': {
        opcode: 'music_midiPlayDrumForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DRUM',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS',
                defaultValue: null
            }
        ]
    },
    'rest:elapsed:from:': {
        opcode: 'music_restForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS',
                defaultValue: null
            }
        ]
    },
    'noteOn:duration:elapsed:from:': {
        opcode: 'music_playNoteForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'note',
                inputName: 'NOTE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS',
                defaultValue: null
            }
        ]
    },
    'instrument:': {
        opcode: 'music_setInstrument',
        argMap: [
            {
                type: 'input',
                inputOp: 'music_menu_INSTRUMENT',
                inputName: 'INSTRUMENT',
                defaultValue: null
            }
        ]
    },
    'midiInstrument:': {
        opcode: 'music_midiSetInstrument',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'INSTRUMENT',
                defaultValue: null
            }
        ]
    },
    'changeVolumeBy:': {
        opcode: 'sound_changevolumeby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VOLUME',
                defaultValue: null
            }
        ]
    },
    'setVolumeTo:': {
        opcode: 'sound_setvolumeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VOLUME',
                defaultValue: null
            }
        ]
    },
    'volume': {
        opcode: 'sound_volume',
        argMap: [
        ]
    },
    'changeTempoBy:': {
        opcode: 'music_changeTempo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TEMPO',
                defaultValue: null
            }
        ]
    },
    'setTempoTo:': {
        opcode: 'music_setTempo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TEMPO',
                defaultValue: null
            }
        ]
    },
    'tempo': {
        opcode: 'music_getTempo',
        argMap: [
        ]
    },
    'clearPenTrails': {
        opcode: 'pen_clear',
        argMap: [
        ]
    },
    'stampCostume': {
        opcode: 'pen_stamp',
        argMap: [
        ]
    },
    'putPenDown': {
        opcode: 'pen_penDown',
        argMap: [
        ]
    },
    'putPenUp': {
        opcode: 'pen_penUp',
        argMap: [
        ]
    },
    'penColor:': {
        opcode: 'pen_setPenColorToColor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR',
                defaultValue: null
            }
        ]
    },
    'changePenHueBy:': {
        opcode: 'pen_changePenHueBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'HUE',
                defaultValue: null
            }
        ]
    },
    'setPenHueTo:': {
        opcode: 'pen_setPenHueToNumber',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'HUE',
                defaultValue: null
            }
        ]
    },
    'changePenShadeBy:': {
        opcode: 'pen_changePenShadeBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SHADE',
                defaultValue: null
            }
        ]
    },
    'setPenShadeTo:': {
        opcode: 'pen_setPenShadeToNumber',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SHADE',
                defaultValue: null
            }
        ]
    },
    'changePenSizeBy:': {
        opcode: 'pen_changePenSizeBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE',
                defaultValue: null
            }
        ]
    },
    'penSize:': {
        opcode: 'pen_setPenSizeTo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE',
                defaultValue: null
            }
        ]
    },
    'senseVideoMotion': {
        opcode: 'videoSensing_videoOn',
        argMap: [
            {
                type: 'input',
                inputOp: 'videoSensing_menu_ATTRIBUTE',
                inputName: 'ATTRIBUTE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'videoSensing_menu_SUBJECT',
                inputName: 'SUBJECT',
                defaultValue: null
            }
        ]
    },
    'whenGreenFlag': {
        opcode: 'event_whenflagclicked',
        argMap: [
        ]
    },
    'whenKeyPressed': {
        opcode: 'event_whenkeypressed',
        argMap: [
            {
                type: 'field',
                fieldName: 'KEY_OPTION',
                defaultValue: null
            }
        ]
    },
    'whenClicked': {
        opcode: 'event_whenthisspriteclicked',
        argMap: [
        ]
    },
    'whenSceneStarts': {
        opcode: 'event_whenbackdropswitchesto',
        argMap: [
            {
                type: 'field',
                fieldName: 'BACKDROP',
                defaultValue: null
            }
        ]
    },
    //'whenSensorGreaterThan': ([, sensor]) => {
    //    if (sensor === 'video motion') {
    //        return {
    //            opcode: 'videoSensing_whenMotionGreaterThan',
    //            argMap: [
    //                // skip the first arg, since we converted to a video specific sensing block
    //                {},
    //                {
    //                    type: 'input',
    //                    inputOp: 'math_number',
    //                    inputName: 'REFERENCE'
    //                }
    //            ]
    //        };
    //    }
    //    return {
    //        opcode: 'event_whengreaterthan',
    //        argMap: [
    //            {
    //                type: 'field',
    //                fieldName: 'WHENGREATERTHANMENU'
    //            },
    //            {
    //                type: 'input',
    //                inputOp: 'math_number',
    //                inputName: 'VALUE'
    //            }
    //        ]
    //    };
    //},
    'whenIReceive': {
        opcode: 'event_whenbroadcastreceived',
        argMap: [
            {
                type: 'field',
                fieldName: 'BROADCAST_OPTION',
                defaultValue: null
            }
        ]
    },
    'broadcast:': {
        opcode: 'event_broadcast',
        argMap: [
            {
                type: 'input',
                inputOp: 'event_broadcast_menu',
                inputName: 'BROADCAST_INPUT',
                defaultValue: null
            }
        ]
    },
    'doBroadcastAndWait': {
        opcode: 'event_broadcastandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'event_broadcast_menu',
                inputName: 'BROADCAST_INPUT',
                defaultValue: null
            }
        ]
    },
    'wait:elapsed:from:': {
        opcode: 'control_wait',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_positive_number',
                inputName: 'DURATION',
                defaultValue: null
            }
        ]
    },
    'doRepeat': {
        opcode: 'control_repeat',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_whole_number',
                inputName: 'TIMES',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doForever': {
        opcode: 'control_forever',
        argMap: [
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doIf': {
        opcode: 'control_if',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'CONDITION',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doIfElse': {
        opcode: 'control_if_else',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'CONDITION',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK2',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doWaitUntil': {
        opcode: 'control_wait_until',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'CONDITION',
                defaultValue: false
            }
        ]
    },
    'doUntil': {
        opcode: 'control_repeat_until',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'CONDITION',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doWhile': {
        opcode: 'control_while',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'CONDITION',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'doForLoop': {
        opcode: 'control_for_each',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'VALUE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'stopScripts': {
        opcode: 'control_stop',
        argMap: [
            {
                type: 'field',
                fieldName: 'STOP_OPTION',
                defaultValue: null
            }
        ]
    },
    'whenCloned': {
        opcode: 'control_start_as_clone',
        argMap: [
        ]
    },
    'createCloneOf': {
        opcode: 'control_create_clone_of',
        argMap: [
            {
                type: 'input',
                inputOp: 'control_create_clone_of_menu',
                inputName: 'CLONE_OPTION',
                defaultValue: null
            }
        ]
    },
    'deleteClone': {
        opcode: 'control_delete_this_clone',
        argMap: [
        ]
    },
    'COUNT': {
        opcode: 'control_get_counter',
        argMap: [
        ]
    },
    'INCR_COUNT': {
        opcode: 'control_incr_counter',
        argMap: [
        ]
    },
    'CLR_COUNT': {
        opcode: 'control_clear_counter',
        argMap: [
        ]
    },
    'warpSpeed': {
        opcode: 'control_all_at_once',
        argMap: [
            {
                type: 'input',
                inputOp: 'substack',
                inputName: 'SUBSTACK',
                defaultValue: [["helium_nop"]]
            }
        ]
    },
    'touching:': {
        opcode: 'sensing_touchingobject',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_touchingobjectmenu',
                inputName: 'TOUCHINGOBJECTMENU',
                defaultValue: null
            }
        ]
    },
    'touchingColor:': {
        opcode: 'sensing_touchingcolor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR',
                defaultValue: null
            }
        ]
    },
    'color:sees:': {
        opcode: 'sensing_coloristouchingcolor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR2',
                defaultValue: null
            }
        ]
    },
    'distanceTo:': {
        opcode: 'sensing_distanceto',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_distancetomenu',
                inputName: 'DISTANCETOMENU',
                defaultValue: null
            }
        ]
    },
    'doAsk': {
        opcode: 'sensing_askandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'QUESTION',
                defaultValue: null
            }
        ]
    },
    'answer': {
        opcode: 'sensing_answer',
        argMap: [
        ]
    },
    'keyPressed:': {
        opcode: 'sensing_keypressed',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_keyoptions',
                inputName: 'KEY_OPTION',
                defaultValue: null
            }
        ]
    },
    'mousePressed': {
        opcode: 'sensing_mousedown',
        argMap: [
        ]
    },
    'mouseX': {
        opcode: 'sensing_mousex',
        argMap: [
        ]
    },
    'mouseY': {
        opcode: 'sensing_mousey',
        argMap: [
        ]
    },
    'soundLevel': {
        opcode: 'sensing_loudness',
        argMap: [
        ]
    },
    'isLoud': {
        opcode: 'sensing_loud',
        argMap: [
        ]
    },
    // 'senseVideoMotion': {
    //     opcode: 'sensing_videoon',
    //     argMap: [
    //         {
    //             type: 'input',
    //             inputOp: 'sensing_videoonmenuone',
    //             inputName: 'VIDEOONMENU1'
    //         },
    //         {
    //             type: 'input',
    //             inputOp: 'sensing_videoonmenutwo',
    //             inputName: 'VIDEOONMENU2'
    //         }
    //     ]
    // },
    'setVideoState': {
        opcode: 'videoSensing_videoToggle',
        argMap: [
            {
                type: 'input',
                inputOp: 'videoSensing_menu_VIDEO_STATE',
                inputName: 'VIDEO_STATE',
                defaultValue: null
            }
        ]
    },
    'setVideoTransparency': {
        opcode: 'videoSensing_setVideoTransparency',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TRANSPARENCY',
                defaultValue: null
            }
        ]
    },
    'timer': {
        opcode: 'sensing_timer',
        argMap: [
        ]
    },
    'timerReset': {
        opcode: 'sensing_resettimer',
        argMap: [
        ]
    },
    'getAttribute:of:': {
        opcode: 'sensing_of',
        argMap: [
            {
                type: 'field',
                fieldName: 'PROPERTY',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'sensing_of_object_menu',
                inputName: 'OBJECT',
                defaultValue: null
            }
        ]
    },
    'timeAndDate': {
        opcode: 'sensing_current',
        argMap: [
            {
                type: 'field',
                fieldName: 'CURRENTMENU',
                defaultValue: null
            }
        ]
    },
    'timestamp': {
        opcode: 'sensing_dayssince2000',
        argMap: [
        ]
    },
    'getUserName': {
        opcode: 'sensing_username',
        argMap: [
        ]
    },
    'getUserId': {
        opcode: 'sensing_userid',
        argMap: [
        ]
    },
    '+': {
        opcode: 'operator_add',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2',
                defaultValue: null
            }
        ]
    },
    '-': {
        opcode: 'operator_subtract',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2',
                defaultValue: null
            }
        ]
    },
    '*': {
        opcode: 'operator_multiply',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2',
                defaultValue: null
            }
        ]
    },
    '/': {
        opcode: 'operator_divide',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2',
                defaultValue: null
            }
        ]
    },
    'randomFrom:to:': {
        opcode: 'operator_random',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'FROM',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TO',
                defaultValue: null
            }
        ]
    },
    '<': {
        opcode: 'operator_lt',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2',
                defaultValue: null
            }
        ]
    },
    '=': {
        opcode: 'operator_equals',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2',
                defaultValue: null
            }
        ]
    },
    '>': {
        opcode: 'operator_gt',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2',
                defaultValue: null
            }
        ]
    },
    '&': {
        opcode: 'operator_and',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'OPERAND1',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'OPERAND2',
                defaultValue: false
            }
        ]
    },
    '|': {
        opcode: 'operator_or',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'OPERAND1',
                defaultValue: false
            },
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'OPERAND2',
                defaultValue: false
            }
        ]
    },
    'not': {
        opcode: 'operator_not',
        argMap: [
            {
                type: 'input',
                inputOp: 'boolean',
                inputName: 'OPERAND',
                defaultValue: false
            }
        ]
    },
    'concatenate:with:': {
        opcode: 'operator_join',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING2',
                defaultValue: null
            }
        ]
    },
    'letter:of:': {
        opcode: 'operator_letter_of',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_whole_number',
                inputName: 'LETTER',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING',
                defaultValue: null
            }
        ]
    },
    'stringLength:': {
        opcode: 'operator_length',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING',
                defaultValue: null
            }
        ]
    },
    '%': {
        opcode: 'operator_mod',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2',
                defaultValue: null
            }
        ]
    },
    'rounded': {
        opcode: 'operator_round',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM',
                defaultValue: null
            }
        ]
    },
    'computeFunction:of:': {
        opcode: 'operator_mathop',
        argMap: [
            {
                type: 'field',
                fieldName: 'OPERATOR',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM',
                defaultValue: null
            }
        ]
    },
    'readVariable': {
        opcode: 'data_variable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            }
        ]
    },
    // Scratch 2 uses this alternative variable getter opcode only in monitors,
    // blocks use the `readVariable` opcode above.
    'getVar:': {
        opcode: 'data_variable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            }
        ]
    },
    'setVar:to:': {
        opcode: 'data_setvariableto',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'VALUE',
                defaultValue: null
            }
        ]
    },
    'changeVar:by:': {
        opcode: 'data_changevariableby',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VALUE',
                defaultValue: null
            }
        ]
    },
    'showVariable:': {
        opcode: 'data_showvariable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            }
        ]
    },
    'hideVariable:': {
        opcode: 'data_hidevariable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                defaultValue: null
            }
        ]
    },
    'contentsOfList:': {
        opcode: 'data_listcontents',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'append:toList:': {
        opcode: 'data_addtolist',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM',
                defaultValue: null
            },
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'deleteLine:ofList:': {
        opcode: 'data_deleteoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX',
                defaultValue: null
            },
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'insert:at:ofList:': {
        opcode: 'data_insertatlist',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX',
                defaultValue: null
            },
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'setLine:ofList:to:': {
        opcode: 'data_replaceitemoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX',
                defaultValue: null
            },
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM',
                defaultValue: null
            }
        ]
    },
    'getLine:ofList:': {
        opcode: 'data_itemoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX',
                defaultValue: null
            },
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'lineCountOfList:': {
        opcode: 'data_lengthoflist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'list:contains:': {
        opcode: 'data_listcontainsitem',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM',
                defaultValue: null
            }
        ]
    },
    'showList:': {
        opcode: 'data_showlist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'hideList:': {
        opcode: 'data_hidelist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                defaultValue: null
            }
        ]
    },
    'procDef': {
        opcode: 'procedures_definition',
        argMap: []
    },
    'getParam': {
        // Doesn't map to single opcode. Import step assigns final correct opcode.
        opcode: 'argument_reporter_string_number',
        argMap: [
            {
                type: 'field',
                fieldName: 'VALUE',
                defaultValue: null
            }
        ]
    },
    'call': {
        opcode: 'procedures_call',
        argMap: []
    }
};

/**
 * Add to the specMap entries for an opcode from a Scratch 2.0 extension. Two entries will be made with the same
 * metadata; this is done to support projects saved by both older and newer versions of the Scratch 2.0 editor.
 * @param {string} sb2Extension - the Scratch 2.0 name of the extension
 * @param {string} sb2Opcode - the Scratch 2.0 opcode
 * @param {SB2SpecMap_blockInfo} blockInfo - the Scratch 3.0 block info
 */
const addExtensionOp = function (sb2Extension, sb2Opcode, blockInfo) {
    /**
     * This string separates the name of an extension and the name of an opcode in more recent Scratch 2.0 projects.
     * Earlier projects used '.' as a separator, up until we added the 'LEGO WeDo 2.0' extension...
     * @type {string}
     */
    const sep = '\u001F'; // Unicode Unit Separator

    // make one entry for projects saved by recent versions of the Scratch 2.0 editor
    scratch2OpcodeMap[`${sb2Extension}${sep}${sb2Opcode}`] = blockInfo;

    // make a second for projects saved by older versions of the Scratch 2.0 editor
    scratch2OpcodeMap[`${sb2Extension}.${sb2Opcode}`] = blockInfo;
};

const weDo2 = 'LEGO WeDo 2.0';

addExtensionOp(weDo2, 'motorOnFor', {
    opcode: 'wedo2_motorOnFor',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_ID',
            inputName: 'MOTOR_ID',
            defaultValue: null
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'DURATION',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'motorOn', {
    opcode: 'wedo2_motorOn',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_ID',
            inputName: 'MOTOR_ID',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'motorOff', {
    opcode: 'wedo2_motorOff',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_ID',
            inputName: 'MOTOR_ID',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'startMotorPower', {
    opcode: 'wedo2_startMotorPower',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_ID',
            inputName: 'MOTOR_ID',
            defaultValue: null
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'POWER',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'setMotorDirection', {
    opcode: 'wedo2_setMotorDirection',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_ID',
            inputName: 'MOTOR_ID',
            defaultValue: null
        },
        {
            type: 'input',
            inputOp: 'wedo2_menu_MOTOR_DIRECTION',
            inputName: 'MOTOR_DIRECTION',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'setLED', {
    opcode: 'wedo2_setLightHue',
    argMap: [
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'HUE',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'playNote', {
    opcode: 'wedo2_playNoteFor',
    argMap: [
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'NOTE',
            defaultValue: null
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'DURATION',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'whenDistance', {
    opcode: 'wedo2_whenDistance',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_OP',
            inputName: 'OP',
            defaultValue: null
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'REFERENCE',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'whenTilted', {
    opcode: 'wedo2_whenTilted',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_TILT_DIRECTION_ANY',
            inputName: 'TILT_DIRECTION_ANY',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'getDistance', {
    opcode: 'wedo2_getDistance',
    argMap: []
});

addExtensionOp(weDo2, 'isTilted', {
    opcode: 'wedo2_isTilted',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_TILT_DIRECTION_ANY',
            inputName: 'TILT_DIRECTION_ANY',
            defaultValue: null
        }
    ]
});

addExtensionOp(weDo2, 'getTilt', {
    opcode: 'wedo2_getTiltAngle',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2_menu_TILT_DIRECTION',
            inputName: 'TILT_DIRECTION',
            defaultValue: null
        }
    ]
});

let scratch3OpcodeMap = {};
for (let prop in scratch2OpcodeMap) {
	if (!scratch2OpcodeMap.hasOwnProperty(prop)) {
		continue;
	}
	let reverseprop = structuredClone(scratch2OpcodeMap[prop]);
	reverseprop.opcode = prop;
	scratch3OpcodeMap[scratch2OpcodeMap[prop].opcode] = reverseprop;
}