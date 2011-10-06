/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
    
    File:        JSONWriterFacade.java
    Created by:  Dave Reynolds
    Created on:  3 Feb 2010
*/

package com.epimorphics.jsonrdf;

/**
 * Interface to look like a JSONWriter. Used to migrate code
 * which used to use JSONWriter to allow it to do object construction.
 * Also allows us to switch between the codehaus version of json.org
 * API which Jersey expects and the more up to date json.org version
 * which we used to use and has advantages (read from stream, better
 * quoting etc).
 * 
 * @author <a href="mailto:der@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public interface JSONWriterFacade {


    /**
     * Begin appending a new array. All values until the balancing
     * <code>endArray</code> will be appended to this array. The
     * <code>endArray</code> method must be called to mark the array's end.
     * @return this
     */
    public JSONWriterFacade array();

    /**
     * End an array. This method most be called to balance calls to
     * <code>array</code>.
     * @return this
     */
    public JSONWriterFacade endArray();

    /**
     * End an object. This method most be called to balance calls to
     * <code>object</code>.
     * @return this
     */
    public JSONWriterFacade endObject();

    /**
     * Append a key. The key will be associated with the next value. In an
     * object, every value must be preceded by a key.
     * @param s A key string.
     * @return this
     */
    public JSONWriterFacade key(String s);

    /**
     * Begin appending a new object. All keys and values until the balancing
     * <code>endObject</code> will be appended to this object. The
     * <code>endObject</code> method must be called to mark the object's end.
     * @return this
     */
    public JSONWriterFacade object();

    /**
     * Append either the value <code>true</code> or the value
     * <code>false</code>.
     * @param b A boolean.
     * @return this
     */
    public JSONWriterFacade value(boolean b);

    /**
     * Append a double value.
     * @param d A double.
     * @return this
     */
    public JSONWriterFacade value(double d);

    /**
     * Append a long value.
     * @param l A long.
     * @return this
     */
    public JSONWriterFacade value(long l);

    /**
     * Append an object value.
     * @param o The object to append. It can be null, or a Boolean, Number,
     *   String, JSONObject, or JSONArray, or an object with a toJSONString()
     *   method.
     * @return this
     */
    public JSONWriterFacade value(Object o);

}

