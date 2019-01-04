//SOURCED FROM HERE
//https://stackoverflow.com/questions/37082744/split-one-quadratic-bezier-curve-into-two

var geom = (function(){
    function Vec(x,y){ // creates a vector
        if(x === undefined){
            x = 1;
            y = 0;
        }
        this.x = x;
        this.y = y;
    }
    Vec.prototype.set = function(x,y){
        this.x = x;
        this.y = y;
        return this;
    };
    // closure vars to stop constant GC
    var v1 = new Vec();
    var v2 = new Vec();
    var v3 = new Vec();
    var v4 = new Vec();
    var v5 = new Vec();
    const BEZIER_TYPES  = {
        cubic : "cubic",
        quadratic : "quadratic",
    };

    // creates a bezier  p1 and p2 are the end points as vectors.
    // if p1 is a string then returns a empty bezier object.
    //          with the type as quadratic (default) or cubic
    //  cp1, [cp2] are the control points. cp2 is optional and if omitted will create a quadratic 
    function Bezier(p1,p2,cp1,cp2){
        if(typeof p1 === 'string'){
            this.p1 = new Vec();
            this.p2 = new Vec();
            this.cp1 = new Vec();
            if(p1 === BEZIER_TYPES.cubic){
                this.cp2 = new Vec();
            }
        }else{
            this.p1 = p1 === undefined ? new Vec() : p1;
            this.p2 = p2 === undefined ? new Vec() : p2;
            this.cp1 = cp1 === undefined ? new Vec() : cp1;
            this.cp2 = cp2;
        }
    }    
    Bezier.prototype.type = function(){
        if(this.cp2 === undefined){
            return BEZIER_TYPES.quadratic;
        }
        return BEZIER_TYPES.cubic;
    }
    Bezier.prototype.pointAt = function(position){
		const a = mixPoints( this.p1, this.cp1, position );
		const b = mixPoints( this.cp2 || this.cp1, this.p2, position );
		return mixPoints( a, b, position );
	}
	Bezier.prototype.splitAt = function(position,start){ // 0 <= position <= 1 where to split. Start if true returns 0 to position and else from position to 1
		
		var retBezier,c;
        if(this.cp2 !== undefined){ retBezier = new Bezier(BEZIER_TYPES.cubic); }
        else{ retBezier = new Bezier(BEZIER_TYPES.quadratic); }
        v1.x = this.p1.x;
        v1.y = this.p1.y;
        c = Math.max(0, Math.min(1, position));  // clamp for safe use in Stack Overflow answer
        if(start === true){
            retBezier.p1.x = this.p1.x;
            retBezier.p1.y = this.p1.y;            
        }else{
            retBezier.p2.x = this.p2.x;
            retBezier.p2.y = this.p2.y;            
        }
        if(this.cp2 === undefined){ // returns a quadratic
            v2.x = this.cp1.x;
            v2.y = this.cp1.y;
            if(start){
                retBezier.cp1.x = (v1.x += (v2.x - v1.x) * c);
                retBezier.cp1.y = (v1.y += (v2.y - v1.y) * c);
                v2.x += (this.p2.x - v2.x) * c;
                v2.y += (this.p2.y - v2.y) * c;
                retBezier.p2.x = v1.x + (v2.x - v1.x) * c;
                retBezier.p2.y = v1.y + (v2.y - v1.y) * c;
                retBezier.cp2 = undefined;
            }else{
                v1.x += (v2.x - v1.x) * c;
                v1.y += (v2.y - v1.y) * c;
                retBezier.cp1.x = (v2.x += (this.p2.x - v2.x) * c);
                retBezier.cp1.y = (v2.y += (this.p2.y - v2.y) * c);
                retBezier.p1.x = v1.x + (v2.x - v1.x) * c;
                retBezier.p1.y = v1.y + (v2.y - v1.y) * c;
                retBezier.cp2 = undefined;
            }
            return retBezier;
        }
        v2.x = this.cp1.x;
        v3.x = this.cp2.x;
        v2.y = this.cp1.y;
        v3.y = this.cp2.y;
        if(start){
            retBezier.cp1.x = (v1.x += (v2.x - v1.x) * c);
            retBezier.cp1.y = (v1.y += (v2.y - v1.y) * c);
            v2.x += (v3.x - v2.x) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            v3.x += (this.p2.x - v3.x) * c;
            v3.y += (this.p2.y - v3.y) * c;
            retBezier.cp2.x = (v1.x += (v2.x - v1.x) * c);
            retBezier.cp2.y = (v1.y += (v2.y - v1.y) * c);
            retBezier.p2.y = v1.y + (v2.y - v1.y) * c;
            retBezier.p2.x = v1.x + (v2.x - v1.x) * c;
        }else{
            v1.x += (v2.x - v1.x) * c;                
            v1.y += (v2.y - v1.y) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            retBezier.cp2.x = (v3.x += (this.p2.x - v3.x) * c);
            retBezier.cp2.y = (v3.y += (this.p2.y - v3.y) * c);
            v1.x += (v2.x - v1.x) * c;
            v1.y += (v2.y - v1.y) * c;
            retBezier.cp1.x = (v2.x += (v3.x - v2.x) * c);
            retBezier.cp1.y = (v2.y += (v3.y - v2.y) * c);
            retBezier.p1.x = v1.x + (v2.x - v1.x) * c;
            retBezier.p1.y = v1.y + (v2.y - v1.y) * c;
        }
        return retBezier;              
    }

    return {
        Vec : Vec,
        Bezier : Bezier,
        bezierTypes : BEZIER_TYPES,
    };
})();

// helper function 
// Returns second order quadratic from points in the same order as most rendering api take then
// The second two coordinates x1,y1 are the control points
function createBezierQuadratic(x, y, x1, y1, x2, y2){
    var b = new geom.Bezier(geom.bezierTypes.quadratic);
    b.p1.set(x, y);
    b.p2.set(x2, y2);
    b.cp1.set(x1, y1);
    return b;
}
// Returns third order cubic from points in the same order as most rendering api take then
// The coordinates x1, y1 and x2, y2 are the control points
function createBezierCubic(x, y, x1, y1, x2, y2, x3, y3){
    var b = new geom.Bezier(geom.bezierTypes.cubic);
    b.p1.set(x, y);
    b.p2.set(x3, y3);
    b.cp1.set(x1, y1);
    b.cp2.set(x2, y2);
    return b;
}

function mixPoints( pntA, pntB, r ){
	return {
		x: mixValues( pntA.x, pntB.x, r ),
		y: mixValues( pntA.y, pntB.y, r )
	}
}

function mixValues( a, b, r ){
	return ((1 - r) * a) + (r * b);
}