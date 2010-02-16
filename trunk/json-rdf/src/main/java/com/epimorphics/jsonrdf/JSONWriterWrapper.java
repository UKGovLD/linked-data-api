/******************************************************************
 * File:        JSONWriterWraper.java
 * Created by:  Dave Reynolds
 * Created on:  3 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import java.io.Writer;

import com.epimorphics.jsonrdf.org.json.JSONException;
import com.epimorphics.jsonrdf.org.json.JSONWriter;

/**
 * Wrap up a JSONWriter to (trivially) implement the JSONWriterFacade interface.
 * Allows for streaming pretty printing.
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class JSONWriterWrapper implements JSONWriterFacade {

    protected JSONWriter jw;
    
    public JSONWriterWrapper(Writer writer) {
        this.jw = new JSONWriter(writer);
    }
    
    public JSONWriterWrapper(Writer writer, boolean pretty) {
        jw = new JSONWriter(writer);
        jw.setPrettyPrint(pretty);
    }
        
    public void setPrettyPrint(boolean pretty) {
        jw.setPrettyPrint(pretty);
    }
    
    @Override
    public JSONWriterFacade array() {
        try {
            jw.array();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endArray() {
        try {
            jw.endArray();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endObject() {
        try {
            jw.endObject();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade key(String s) {
        try {
            jw.key(s);
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade object() {
        try {
            jw.object();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(boolean b) {
        try {
            jw.value(b);
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(double d) {
        try {
            jw.value(d);
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(long l) {
        try {
            jw.value(l);
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(Object o) {
        try {
            jw.value(o);
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

}

