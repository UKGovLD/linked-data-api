package com.epimorphics.jsonrdf.extras;

import java.io.StringWriter;

public class IndentedLineBuffer extends IndentedWriter {
    StringWriter sw ;
    public IndentedLineBuffer() { this(false) ; }
    
    public IndentedLineBuffer(boolean withLineNumbers)
    {
        super(new StringWriter(), withLineNumbers) ;
        sw = (StringWriter)super.out ;
    }
    
    public StringBuffer getBuffer() { return sw.getBuffer(); }
    
    public String asString() { return sw.toString() ; }
    @Override
    public String toString() { return asString() ; }

    // Names more usually used for a buffer.
    public void append(String fmt, Object... args) { printf(fmt, args) ; }
    public void append(char ch)  { print(ch) ;}
    
    public void clear() { sw.getBuffer().setLength(0) ; }


}
