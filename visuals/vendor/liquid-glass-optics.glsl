// Optical field adapted from dashersw/liquid-glass-js/container.js (MIT).
// No DOM screenshots are taken; the source is a local procedural studio texture.
float roundedRectDistance(vec2 coord, vec2 size, float radius) {
 vec2 center=size*.5;vec2 pixelCoord=coord*size;
 vec2 toCorner=abs(pixelCoord-center)-(center-radius);
 float outsideCorner=length(max(toCorner,0.));
 float insideCorner=min(max(toCorner.x,toCorner.y),0.);
 return outsideCorner+insideCorner-radius;
}
vec2 glassRefraction(vec2 coord,vec2 size,float radius){
 float edge=max(-roundedRectDistance(coord,size,radius),0.);
 vec2 normal=normalize(coord-.5+vec2(.00001));
 float baseIntensity=1.-exp(-edge*.03);
 float edgeIntensity=exp(-edge*.05);
 float rimIntensity=exp(-edge*.12);
 float totalIntensity=baseIntensity*.004+edgeIntensity*.035+rimIntensity*.018;
 float cornerDistance=max(min(coord.x,1.-coord.x),min(coord.y,1.-coord.y));
 float cornerBoost=exp(-cornerDistance*min(size.x,size.y)*.3)*.012;
 return normal*(totalIntensity+cornerBoost);
}
