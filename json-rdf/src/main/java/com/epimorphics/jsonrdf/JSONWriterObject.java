/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        JSONWriterObject.java
    Created by:  Dave Reynolds
    Created on:  3 Feb 2010
*/

package com.epimorphics.jsonrdf;

import java.util.ArrayDeque;

import org.openjena.atlas.json.JsonException;
import org.openjena.atlas.json.JsonObject;
import org.openjena.atlas.json.JsonArray;

/**
 * Implements the JSONWriter emulation by creating a JsonObject
 * 
 * @author <a href="mailto:der@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class JSONWriterObject implements JSONWriterFacade {

    protected ArrayDeque<Object> stack = new ArrayDeque<Object>();
    protected ArrayDeque<String> keystack = new ArrayDeque<String>();
    protected Object top = null;
    protected String key = "dummy";
    
    /**
     * Return the created  JsonObject
     */
    public JsonObject getTopObject() {
        if (! (top instanceof JsonObject)) {
            throw new EncodingException("getTopObject called on non object");
        }
        return (JsonObject) top;
    }
    
    /**
     * Return the created  JsonArray
     */
    public JsonArray getTopArray() {
        if (! (top instanceof JsonArray)) {
            throw new EncodingException("getTopArray called on non array");
        }
        return (JsonArray) top;
    }
    
    @Override
    public JSONWriterFacade array() {
        if (top != null) {
            stack.push( top );
            top = new JsonArray();
            keystack.push(key);
        } else {
            top = new JsonArray();
        }
        return this;
    }

    @Override
    public JSONWriterFacade endArray() {
        if (! (top instanceof JsonArray)) {
            throw new EncodingException("endArray called on non array");
        }
        JsonArray o = (JsonArray)top;
        if (stack.isEmpty()) return this;
        top = stack.pop();
        key = keystack.pop();
        if (top instanceof JsonObject) {
            try {
                ((JsonObject)top).put(key, o);
            } catch (JsonException e) {
                throw new EncodingException(e.getMessage(), e);
            }
        } else {
            ((JsonArray)top).add(o);
        }
        return this;
    }

    @Override
    public JSONWriterFacade endObject() {
        if (! (top instanceof JsonObject)) {
            throw new EncodingException("endObject called on non object");
        }
        JsonObject o = (JsonObject)top;
        if (stack.isEmpty()) return this;
        top = stack.pop();
        key = keystack.pop();
        if (top instanceof JsonObject) {
            try {
                ((JsonObject)top).put(key, o);
            } catch (JsonException e) {
                throw new EncodingException(e.getMessage(), e);
            }
        } else {
            ((JsonArray)top).add(o);
        }
        return this;
    }

    @Override
    public JSONWriterFacade key(String s) {
        if (! (top instanceof JsonObject)) {
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
            top = new JsonObject();
        } else {
            top = new JsonObject();
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(boolean b) {
        try {
            if (top instanceof JsonObject) {
                ((JsonObject)top).put(key, b);
            } else {
                ((JsonArray)top).add(b);
            }
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override
    public JSONWriterFacade value(double d) {    	
    	if (true) throw new IllegalArgumentException( "Given a double" );
//        try {
//            if (top instanceof JsonObject) {
//                ((JsonObject)top).put(key, d);
//            } else {
//                ((JsonArray)top).put(d);
//            }
//        } catch (JsonException e) {
//            throw new EncodingException(e.getMessage(), e);
//        }
        return this;
    }

    @Override
    public JSONWriterFacade value(long l) {
        try {
            if (top instanceof JsonObject) {
                ((JsonObject)top).put(key, l);
            } else {
                ((JsonArray)top).add(l);
            }
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        return this;
    }

    @Override public JSONWriterFacade value(Object o) {
    	try {
    		if (o instanceof String) valueString( (String) o );
    		else if (o instanceof Integer) valueInteger( (Integer) o );
    		else throw new IllegalArgumentException( "Given a " + o.getClass().getSimpleName() );
    	} catch (JsonException e) {
    		throw new EncodingException(e.getMessage(), e);
    	}        
        return this;
    }

	private void valueString(String s) {
		if (top instanceof JsonObject) ((JsonObject)top).put(key, s);
		else ((JsonArray)top).add(s);		
		}

	private void valueInteger(Integer i) {
		if (top instanceof JsonObject) ((JsonObject)top).put(key, i);
		else ((JsonArray)top).add(i);		
		}

}

