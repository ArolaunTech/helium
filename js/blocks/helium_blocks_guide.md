## Helium Blocks guide

This document is intended as a guide to the various internal blocks used inside Helium's compiler. All Helium-added blocks' opcodes start with "helium".

### List of Helium blocks

 - **helium_videomotion:** <br/>
   The monitor form of the <br/> 
   ![videoSensing_videoOn](/js/blocks/imgs/videoSensing_videoOn.svg) <br/>
   block. This existed in Scratch 2 but does not exist in Scratch 3.

 - **helium_time:** <br/>
   A monotonically increasing time variable. Increases at a rate of 1/second.

 - **helium_ask:** <br/>
   Show the text input display created by **sensing_askandwait**.

 - **helium_cos:** <br/>
   Given a value x in radians, return the cosine of x.

 - **helium_sin:** <br/>
   Given a value x in radians, return the sine of x.

 - **helium_asin:** <br/>
   Given a value x, return the arcsine of x in radians.

 - **helium_acos:** <br/>
   Given a value x, return the arccosine of x in radians.

 - **helium_atan:** <br/>
   Given a value x, return the arctangent of x in radians.

 - **helium_abs:** <br/>
   Given a value x, return the absolute value of x.

 - **helium_floor:** <br/>
   Given a value x, return the floor of x.

 - **helium_ceiling:** <br/>
   Given a value x, return the ceiling of x.

 - **helium_sqrt:** <br/>
   Given a value x, return the square root of x.

 - **helium_tan:** <br/>
   Given a value x, return the tangent of x.

 - **helium_ln:** <br/>
   Given a value x, return the natural logarithm of x.

 - **helium_log:** <br/>
   Given a value x, return the base-10 logarithm of x.

 - **helium_e ^:** <br/>
   Given a value x, return e<sup>x</sup>.

 - **helium_10 ^:** <br/>
   Given a value x, return 10<sup>x</sup>.

 - **helium_xposition:** <br/>
   Returns the raw x position of its sprite.

 - **helium_yposition:** <br/>
   Returns the raw y position of its sprite.

 - **helium_direction:** <br/>
   Returns the raw direction of its sprite in radians. 0 means "pointing to the right", pi/2 means "pointing up", etc.

 - **helium_scale:** <br/>
   Returns the size of its sprite divided by 100%. 1 means 100% size, 0.5 means 50% size, 2 means 200% size, etc.

 - **helium_setscaleto:** <br/>
   Sets the scale of a sprite to a given number. See **helium_scale** above.

 - **helium_costume:** <br/>
   Given the costume number, return the costume name.

 - **helium_costumenumber:** <br/>
   Return the 0-indexed current costume number.

 - **helium_backdrop:** <br/>
   Given the backdrop number, return the backdrop name.

 - **helium_backdropnumber:** <br/>
   Return the 0-indexed current backdrop number.

 - **helium_random:** <br/>
   Return a random number between 0 and 1.

 - **helium_stagewidth:** <br/>
   The curernt width of the stage. Is 480 pixels by default.

 - **helium_stageheight:** <br/>
   The current height of the stage. Is 360 pixels by default.

 - **helium_pointindirection:** <br/>
   Directly set the direction of a sprite.

 - **helium_nop:** <br/>
   Does nothing.

 - **helium_atan2:** <br/>
   Does the same thing as **Math.atan2(y, x)**.

 - **helium_max:** <br/>
   Returns the maximum of some numbers.

 - **helium_min:** <br/>
   Returns the minimum of some numbers.

 - **helium_boundsleft, helium_boundsright, helium_boundstop, helium_boundsbottom:** <br/>
   Returns the bounding box of a sprite.

 - **helium_number:** <br/>
   Casts a value to a number?

 - **helium_playDrum:** <br/>
   Plays a drum.

 - **helium_wrapClamp:** <br/>
   Wraps numbers around until they fit in a given range.

 - **helium_playNote:** <br/>
   Plays a note.

 - **helium_val:** <br/>
   Defines an SSA variable.

 - **helium_getvariation:** <br/>
   Returns the value of a special kind of value that tracks variables.

 - **helium_start, helium_end:** <br/>
   Define the start and end of basic blocks.

 - **helium_variation:** <br/>
   Defines a variation. See **helium_getvariation** above.

 - **helium_updatevar:** <br/>
   Updates a Scratch variable with a variation.

 - **helium_append, helium_delete, helium_replace, helium_insert:** <br/>
   The Scratch list operations, but they don't modify their input list.

 - **helium_phi:** <br/>
   Defines a phi node.