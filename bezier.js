class BezierCurve
{
    static COLOR_POINT = "#FFFFFF";
    static COLOR_CONTROL_POINT = "#FF0000";
    static COLOR_VERTICE = "#FFFF00";
  
    constructor(points,opts={})
    {
        this.sample = opts.sample??50;
        this.length = 0.0;
        if (points)
        {
          this.P = points.map( p => p.copy() );
          this.build(opts);
        }
    }
    

    getVectorAt(t)
    {
        let _t  = 1.0-t;
        return createVector( _t*this.P[0].x+t*this.P[1].x, _t*this.P[0].y+t*this.P[1].y );
    }

    computeVertices()
    {
        this.vertices = [];
        let t=0.0;
        for (let i=0; i<this.sample; i++)
        {
            t   = map(i,0,this.sample-1,0,1);
            this.vertices.push( this.getVectorAt(t) );
        }
      return this;
    }

    computeLength()
    {
      this.verticesLength = [];
      this.length = 0.0;
      for (let i=0; i<this.vertices.length; i++)
      {
        if (i>=1)
          this.length += dist(this.vertices[i].x,this.vertices[i].y,this.vertices[i-1].x,this.vertices[i-1].y);
        this.verticesLength.push(this.length);
      }
      return this;
    }

    computeVerticesUniform(opts={})
    {
        let nbUniforms = this.sample;
        if (opts.uniforms && opts.uniforms.nb) nbUniforms = int(opts.uniforms.nb);
        this.verticesUniform = this.getUniformVertices(nbUniforms, opts.uniforms??{});
      return this;
    }

    build(opts={})
    {
      this.computeVertices()
        .computeLength()
        .computeVerticesUniform(opts);
    }
  

    getUniformVertices(nb, opts={})
    {
        let uniform = [];
        if (this.length>0)
        {
          if (opts.nb_as_length)  nb = Math.round(this.length / nb)+1;
          let currIdx = 0;

            for (let i=0; i<nb-1; i++)
            {
                let t     = map(i,0,nb-1, 0.0,1.0);
                let currT = t * this.length;
                while(currT >= this.verticesLength[currIdx]){
                    currIdx++;
                }
              
                let p = this.vertices[currIdx - 1];
                let q = this.vertices[currIdx];
                let frac = ((currT - this.verticesLength[currIdx - 1]) / (this.verticesLength[currIdx] - this.verticesLength[currIdx - 1]));
                uniform.push( mapV(p,q,frac) );
            }
          
            //if (opts.nb_as_length == true)
            uniform.push( this.vertices[this.vertices.length-1] );
        }
        //for (let i=1;i<uniform.length;i++)
          //console.log(i-1,i,dist(uniform[i-1].x,uniform[i-1].y,uniform[i].x,uniform[i].y))
        return uniform;
    }    

    draw(opts={})
    {
      beginShape();
      if ('t' in opts)
      {
          if (this.verticesUniform.length>=2)
          {
            let l = constrain(opts.t,0.0,1.0) * this.length;
            let stepLength =  this.length / (this.verticesUniform.length-1);
            let l_ = 0.0;
            for (let i=0; i<this.verticesUniform.length; i++)
            {
              l_ = stepLength*i;
              if (l_<=l)
              {
                vertex(this.verticesUniform[i].x,this.verticesUniform[i].y);
              }
              else
              {
                let lprev = stepLength*(i-1);
                let t = (l-lprev) / (l_-lprev);               
                vertex( 
                  lerp(this.verticesUniform[i-1].x,this.verticesUniform[i].x,t),
                  lerp(this.verticesUniform[i-1].y,this.verticesUniform[i].y,t)
                );
                break;
              }
            }
            
          }
      }
      else
      {
        this.vertices.forEach( v=>vertex(v.x,v.y) );
      }
      endShape();
      
      if (opts.infos === true)
        this.drawInfos();
    }

    drawInfos(){}

    drawVertices(opts={})
    {
      let vertices = opts.uniform ? this.verticesUniform : this.vertices;    
      
      push();
      rectMode(CENTER);
      noStroke();
      fill(BezierCurve.COLOR_VERTICE);
      vertices.forEach( (v,index)=>{ square(v.x,v.y,3); /*text(`${index}`,v.x+5,v.y)*/} );
      pop();
    }

    drawLine(p1,p2,c)
    {
      push();
      stroke(c);
      line(p1.x,p1.y,p2.x,p2.y);
      pop();      
    }

    drawPoint(p,c=BezierCurve.COLOR_POINT)
    {
      push();
      rectMode(CENTER);
      noStroke();
      fill(c);
      square(p.x,p.y,5)
      pop();      
    }
  
}

// --------------------------------------------
class BezierLine extends BezierCurve
{
    constructor(x1,y1,x2,y2,opts={})
    {
      // Force sample to be 2
      let optsLine = structuredClone(opts);
      optsLine.sample = 2;
      
      super([createVector(x1,y1),createVector(x2,y2)],optsLine);
      //console.log( "uniforms", this.verticesUniform.length, "vertices", this.vertices.length, "length", this.length )
    }

    drawInfos()
    {
      this.drawPoint(this.P[0]);
      this.drawPoint(this.P[1]);
    }

}

// --------------------------------------------
class BezierQuadratic extends BezierCurve
{
    constructor(x1,y1,xc,yc,x2,y2,opts={})
    {
        super([createVector(x1,y1),createVector(xc,yc),createVector(x2,y2)],opts);
    }
  
    getVectorAt(t)
    {
        let _t  = 1.0-t;
        return createVector(
            _t*_t*this.P[0].x + 2*_t*t*this.P[1].x + t*t*this.P[2].x,
            _t*_t*this.P[0].y + 2*_t*t*this.P[1].y + t*t*this.P[2].y
        )
    }
  
    drawInfos()
    {
      this.drawLine(this.P[0],this.P[1],BezierCurve.COLOR_CONTROL_POINT);
      this.drawLine(this.P[1],this.P[2],BezierCurve.COLOR_CONTROL_POINT);
      this.drawPoint(this.P[0]);
      this.drawPoint(this.P[1],BezierCurve.COLOR_CONTROL_POINT);
      this.drawPoint(this.P[2]);
    }
}

// --------------------------------------------
class BezierCubic extends BezierCurve
{
    constructor(x1,y1,xc1,yc1,xc2,yc2,x2,y2,opts={})
    {
        super([createVector(x1,y1),createVector(xc1,yc1),createVector(xc2,yc2),createVector(x2,y2)],opts);
    }

    getVectorAt(t)
    {
        let _t  = 1.0-t;
        return createVector(
            _t*_t*_t*this.P[0].x + 3*_t*_t*t*this.P[1].x + 3*_t*t*t*this.P[2].x + t*t*t*this.P[3].x,
            _t*_t*_t*this.P[0].y + 3*_t*_t*t*this.P[1].y + 3*_t*t*t*this.P[2].y + t*t*t*this.P[3].y
        )
    }
  
    drawInfos()
    {
      this.drawLine(this.P[0],this.P[1],BezierCurve.COLOR_CONTROL_POINT);
      this.drawLine(this.P[2],this.P[3],BezierCurve.COLOR_CONTROL_POINT);
      this.drawPoint(this.P[0]);
      this.drawPoint(this.P[1],BezierCurve.COLOR_CONTROL_POINT);
      this.drawPoint(this.P[2],BezierCurve.COLOR_CONTROL_POINT);
      this.drawPoint(this.P[3]);
    }

}

// --------------------------------------------
class BezierComposition
{
  constructor()
  {
    this.curves = [];
  }

  addCurves(curves)
  {
    if (Array.isArray(curves))
    {
      curves.forEach( c=> this.curves.push(c) );
      this.build();
    }
    return this;
  }
  
  getLength()
  {
    let l = 0;
    for (let i=0;i<this.curves.length;i++)
      l+=this.curves[i].length;
    return l;
  }  
  
  build()
  {
    // Consider it's continuous
    let l = this.getLength();
    let arclen = 0.0;
    this.verticesUniform = [];
    this.curves.forEach( (c,index) =>
    {
        c.arclen = arclen;
      
        let nb = index == this.curves.length-1 ? c.verticesUniform.length : c.verticesUniform.length-1;
        for (let i=0; i<nb; i++)
          this.verticesUniform.push( c.verticesUniform[i].copy() );
        arclen += c.length;
    })
      //console.log(this.verticesUniform.length)
    
  }
  
  draw(opts={})
  {
    if (opts.t)
    {
      let arclen = opts.t*this.getLength();
      // Find the index of the curve
      for (let i=0;i<this.curves.length;i++)
      {
        let c = this.curves[i];
        if (arclen >= c.arclen)
        {
          // Middle of a curve
          if (arclen <= (c.arclen+c.length))
            c.draw({'t':(arclen-c.arclen) / c.length});       
          // After the curve
          else 
            c.draw({'t':1.0});       
        }
      }
    }
    else
    {
      this.curves.forEach( c=>c.draw() )
    }
    
    if (opts.infos)
    {
      this.curves.forEach( c=>c.drawInfos() )
    }
    return this;
  }
  
  drawVertices(opts={})
  {
    this.curves.forEach( c=>c.drawVertices(opts) );
    return this;
  }
  
}

// --------------------------------------------
function mapV(A,B,t)
{
    return createVector(
        map(t,0,1,A.x,B.x),
        map(t,0,1,A.y,B.y,t)
    );
}

// --------------------------------------------
function expandBoundingBox(bbToExpand, bb)
{
  return {
        x1: Math.min(bbToExpand.x1, bb.x1),
        y1: Math.min(bbToExpand.y1, bb.y1),
        x2: Math.max(bbToExpand.x2, bb.x2),
        y2: Math.max(bbToExpand.y2, bb.y2)
    };  
}

