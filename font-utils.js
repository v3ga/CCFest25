function getCurvesForString(str,xStr,yStr,fontSize,optsCurve)
{
  let curves = [];  
  let bc;
  
  // Convert the str to glyphs
  let glyphs = theFont.font.stringToGlyphs(str);
  
  // Bounding box
  let bb;
  
  // Iterate over each glyph
  glyphs.forEach( glyph=>
  {
    // Extract path information
    // Opentype will translate and scale the glyph data to fit for fontSize
    let path = glyph.getPath(xStr,yStr,fontSize);
    
    // Get bounding box
    bb = bb ? expandBoundingBox(bb,path.getBoundingBox()) : path.getBoundingBox();
  
    // Iterate over each command for the path
    // Let's have x / y to track position 
    let x=0,y=0;
    path.commands.forEach( (command,i) => 
    {
      if (command.type == 'M')
      {
        x = command.x;
        y = command.y;
        
        bc = new BezierComposition();
      }
      else if (command.type == 'L')
      {
        let aLine = new BezierLine(x,y,command.x,command.y,optsCurve);
        bc.addCurves([aLine]);
        x = command.x;
        y = command.y;
      }
      else if (command.type == 'Q')
      {
        let aQuadCurve = new BezierQuadratic(x,y,command.x1,command.y1,command.x,command.y, optsCurve);
        aQuadCurve.draw();
        bc.addCurves([aQuadCurve]);
        x = command.x;
        y = command.y;
      }
      else if (command.type == 'C')
      {
        let aCubicCurve = new BezierCubic(x,y,command.x1,command.y1,command.x2,command.y2,command.x,command.y, optsCurve);
        bc.addCurves([aCubicCurve]);
        x = command.x;
        y = command.y;
      }
      else if (command.type=='Z')
      {
        curves.push(bc);
      }
    })
    
    // No kerning for the moment
    xStr += theFont._scale(fontSize) * glyph.advanceWidth;
    
  })  
  
  return [curves,bb];
}


