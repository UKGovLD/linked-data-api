/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        JSONWriterWraper.java
    Created by:  Dave Reynolds
    Created on:  3 Feb 2010
*/

package com.epimorphics.jsonrdf;

import java.io.Writer;
import java.math.BigDecimal;

import org.openjena.atlas.json.JsonException;

import com.epimorphics.jsonrdf.extras.JSStreamingWriter;


/**
 * Wrap up a JSONWriter to (trivially) implement the JSONWriterFacade interface.
 * Allows for streaming pretty printing.
 * 
 * @author <a href="mailto:der@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class JSONWriterWrapper implements JSONWriterFacade {

    protected JSStreamingWriter jw;
    
    public JSONWriterWrapper(Writer writer) {
        this.jw = new JSStreamingWriter(writer);
    }
    
    public JSONWriterWrapper(Writer writer, boolean pretty) {
        jw = new JSStreamingWriter(writer);
        // jw.setPrettyPrint(pretty);
    }
        
    public void setPrettyPrint(boolean pretty) {
        // jw.setPrettyPrint(pretty);
    }
    
    @Override
    public JSONWriterFacade array() {
        try {
            jw.startArray();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endArray() {
        try {
            jw.finishArray();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endObject() {
        try {
            jw.finishObject();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade key(String s) {
        try {
            jw.key(s);
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade object() {
        try {
            jw.startObject();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(boolean b) {
        try {
            jw.value(b);
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override public JSONWriterFacade value(double d) {
        try {
            jw.value(d);
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override public JSONWriterFacade value(long l) {
        try {
            jw.value(l);
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override public JSONWriterFacade value(Object o) {
        try {
        	if (o instanceof String) jw.value( (String) o );
        	else if (o instanceof Double) jw.value( ((Double) o).doubleValue() );
        	else if (o instanceof Integer) jw.value( ((Integer) o).intValue() );
        	 else if (o instanceof Float) jw.value( ((Float) o).doubleValue() );
        	 else if (o instanceof Boolean) jw.value( ((Boolean) o).booleanValue() );
        	 else if (o instanceof BigDecimal) jw.value( ((BigDecimal) o).doubleValue() ); // TODO is this right?
            // jw.value(o);
        	else 
        		throw new RuntimeException( "given value: " + o + " [class " + o.getClass().getSimpleName() + "]" );
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

}

