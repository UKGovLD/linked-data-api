/******************************************************************
 * File:        JSONWriterObject.java
 * Created by:  Dave Reynolds
 * Created on:  3 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import java.util.ArrayDeque;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Implements the JSONWriter emulation by creating a JSONObject
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class JSONWriterObject implements JSONWriterFacade {

    protected ArrayDeque<Object> stack = new ArrayDeque<Object>();
    protected ArrayDeque<String> keystack = new ArrayDeque<String>();
    protected Object top = null;
    protected String key = "dummy";
    
    /**
     * Return the created  JSONObject
     */
    public JSONObject getTopObject() {
        if (! (top instanceof JSONObject)) {
            throw new EncodingException("getTopObject called on non object");
        }
        return (JSONObject) top;
    }
    
    /**
     * Return the created  JSONArray
     */
    public JSONArray getTopArray() {
        if (! (top instanceof JSONArray)) {
            throw new EncodingException("getTopArray called on non array");
        }
        return (JSONArray) top;
    }
    
    @Override
    public JSONWriterFacade array() {
        if (top != null) {
            stack.push( top );
            top = new JSONArray();
            keystack.push(key);
        } else {
            top = new JSONArray();
        }
        return this;
    }

    @Override
    public JSONWriterFacade endArray() {
        if (! (top instanceof JSONArray)) {
            throw new EncodingException("endArray called on non array");
        }
        JSONArray o = (JSONArray)top;
        if (stack.isEmpty()) return this;
        top = stack.pop();
        key = keystack.pop();
        if (top instanceof JSONObject) {
            try {
                ((JSONObject)top).put(key, o);
            } catch (JSONException e) {
                throw new EncodingException(e.getMessage(), e);
            }
        } else {
            ((JSONArray)top).put(o);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endObject() {
        if (! (top instanceof JSONObject)) {
            throw new EncodingException("endObject called on non object");
        }
        JSONObject o = (JSONObject)top;
        if (stack.isEmpty()) return this;
        top = stack.pop();
        key = keystack.pop();
        if (top instanceof JSONObject) {
            try {
                ((JSONObject)top).put(key, o);
            } catch (JSONException e) {
                throw new EncodingException(e.getMessage(), e);
            }
        } else {
            ((JSONArray)top).put(o);
        }
        return this;
    }

    @Override
    public JSONWriterFacade key(String s) {
        if (! (top instanceof JSONObject)) {
            throw new EncodingException("key called on non object");
        }
        key = s;
        return this;
    }

    @Override
    public JSONWriterFacade object() {
        if (top != null) {
            stack.push( top );
            keystack.push( key );
            top = new JSONObject();
        } else {
            top = new JSONObject();
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(boolean b) {
        try {
            if (top instanceof JSONObject) {
                ((JSONObject)top).put(key, b);
            } else {
                ((JSONArray)top).put(b);
            }
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(double d) {
        try {
            if (top instanceof JSONObject) {
                ((JSONObject)top).put(key, d);
            } else {
                ((JSONArray)top).put(d);
            }
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(long l) {
        try {
            if (top instanceof JSONObject) {
                ((JSONObject)top).put(key, l);
            } else {
                ((JSONArray)top).put(l);
            }
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(Object o) {
        try {
            if (top instanceof JSONObject) {
                ((JSONObject)top).put(key, o);
            } else {
                ((JSONArray)top).put(o);
            }
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

}

