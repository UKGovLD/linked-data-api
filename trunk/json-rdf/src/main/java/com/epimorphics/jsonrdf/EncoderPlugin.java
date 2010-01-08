/******************************************************************
 * File:        EncoderPlugin.java
 * Created by:  Dave Reynolds
 * Created on:  21 Dec 2009
 * 
 * (c) Copyright 2009, Epimorphics Limited
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import com.epimorphics.jsonrdf.org.json.JSONArray;
import com.epimorphics.jsonrdf.org.json.JSONException;
import com.epimorphics.jsonrdf.org.json.JSONObject;
import com.epimorphics.jsonrdf.org.json.JSONWriter;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.RDFNode;

/**
 * Signature for plugins which perform all the encoding decisions.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public interface EncoderPlugin {
    /** String used as the property name for identifying resources */
    public String getPNResourceID();  
    
    /** Encode a resource URI */
    public String encodeResourceURI(String uri);
    
    /** Encode a reference to a bNode via a mapped identifier number */
    public String encodebNodeId(int id);
    
    /** Encode a literal as a JSON compatible object */
    public Object encode(Literal lit);
    
    /** Write the outer result wrapper.  */
    public void writeHeader(JSONWriter jw) throws JSONException;
    
    /** Writer header for a results/model array object   */
    public void startResults(JSONWriter jw) throws JSONException ;
    
    /** Write the context object to a JSON stream */
    public void writeContext(Context context, JSONWriter jw) throws JSONException;
    
    /** Start a sub-section for outputing named graphs */
    public void startNamedGraphs(JSONWriter jw) throws JSONException ;
    
    /** Start a specific named graph */
    public void startNamedGraph(JSONWriter jw, String name) throws JSONException ;
    
    /** Finish a specific named graph */
    public void finishNamedGraph(JSONWriter jw) throws JSONException ;
    
    /** Finish the entire second of named graphs, assumes last graph has been closed */
    public void finishNamedGraphs(JSONWriter jw) throws JSONException ;
    
    /** Return the array of encoded graphs from a top level JSON results set, or null if there is none */
    public JSONArray getNamedGraphs(JSONObject jobj);
    
    /** Return the name of a named graph */
    public String getGraphName(JSONObject graph) throws JSONException ;
    
    /** Extract the context part of a deserialized JSON object 
     * @throws JSONException */
    public Context getContext(JSONObject jobj) throws JSONException ;
    
    /** Extract the context part of an embedded deserialized JSON object, no version checks  */
    public Context getEmbeddedContext(JSONObject jObj) throws JSONException;
    
    /** Extract the results part of a deserialized JSON object */
    public JSONArray getResults(JSONObject jobj) throws JSONException;
    
    /** Decode a resource URI */
    public String decodeResourceURI(String code);
    
    /** Decode an RDF value (object of a statement) */
    public RDFNode decodeValue(Object jsonValue, Decoder decoder, String type);
}

