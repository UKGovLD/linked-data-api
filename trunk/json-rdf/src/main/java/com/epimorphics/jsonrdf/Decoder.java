/******************************************************************
 * File:        Decoder.java
 * Created by:  Dave Reynolds
 * Created on:  23 Dec 2009
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

import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.epimorphics.jsonrdf.impl.EncoderDefault;
import com.epimorphics.jsonrdf.org.json.JSONArray;
import com.epimorphics.jsonrdf.org.json.JSONException;
import com.epimorphics.jsonrdf.org.json.JSONObject;
import com.epimorphics.jsonrdf.org.json.JSONTokener;
import com.hp.hpl.jena.query.DataSource;
import com.hp.hpl.jena.query.DatasetFactory;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.vocabulary.RDF;
import com.hp.hpl.jena.vocabulary.RDFS;

public class Decoder {

    protected static EncoderPlugin encoder = new EncoderDefault() ;
    
    /**
     * Decode a JSON object from the reader into a set of resources within
     * a reconstructed RDF Model.
     * @throws EncodingException if there is a jsonrdf level error or JSON error
     */
    public static List<Resource> decode(Reader reader) {
        try {
            JSONObject jObj = new JSONObject( new JSONTokener(reader) );
            Context context = encoder.getContext(jObj);
            return new Decoder(context, jObj).decodeResources();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }
    
    /**
     * Decode a JSON object from the reader into a model.
     * @throws EncodingException if there is a jsonrdf level error or JSON error
     */
    public static Model decodeModel(Reader reader) {
        return modelFromRoots( decode(reader) );
    }
    
    private static Model modelFromRoots(List<Resource> roots) {
        if (roots != null && ! roots.isEmpty()) {
            return roots.get(0).getModel();
        } else {
            return ModelFactory.createDefaultModel();
        }
    }
    
    /**
     * Decode a JSON object from the reader into collection of named graphs
     * @throws EncodingException if there is a jsonrdf level error or JSON error
     */
    public static DataSource decodeGraphs(Reader reader) {
        try {
            JSONObject jObj = new JSONObject( new JSONTokener(reader) );
            Context context = encoder.getContext(jObj);
            Model def = modelFromRoots( new Decoder(context, jObj).decodeResources() );
            DataSource set = DatasetFactory.create(def);
            JSONArray graphs = encoder.getNamedGraphs(jObj);
            if (graphs != null) {
                for (int i = 0; i < graphs.length(); i++) {
                    JSONObject graph = graphs.getJSONObject(i);
                    String name = encoder.getGraphName(graph);
                    Model model = modelFromRoots( new Decoder(context, graph).decodeResources() );
                    set.addNamedModel(name, model);
                }
            }
            return set;
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }
    
    protected Context context;
    protected JSONObject j;
    protected Model model = ModelFactory.createDefaultModel();
    protected Map<Integer, Resource> bNodes = new HashMap<Integer, Resource>();
    
    public Decoder(Context context, JSONObject jObj) {
        this.context = context;
        this.j = jObj;
    }
    
    public List<Resource> decodeResources() throws JSONException {
        JSONArray results = encoder.getResults(j);
        List<Resource> roots = new ArrayList<Resource>();
        
        int len = results.length();
        for (int i = 0; i < len; i++) {
            roots.add( decodeResource(results.getJSONObject(i)) );
        }
        return roots;
    }
    
    Resource decodeResource(JSONObject rObj) throws JSONException {
        String uriCode = rObj.optString( encoder.getPNResourceID(), null );
        Resource r = (uriCode == null || uriCode.startsWith("_:")) 
                        ? bNodeForID( uriCode ) 
                        : resourceForURI( encoder.decodeResourceURI(uriCode) );
        Iterator<String> keys = rObj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            if (key.equals( encoder.getPNResourceID()) ) continue;
            
            Context.Prop prop = context.getPropertyByName(key);
            Property p = (prop == null) 
                    ? model.getProperty( context.getURIfromName(key) )
                    : prop.getProperty(model);
            String range = (prop == null) ? RDFS.Resource.getURI() : prop.getType();
            Object val = rObj.get(key);
            if (val instanceof JSONArray) {
                JSONArray vala = (JSONArray)val;
                if (prop != null && prop.getType().equals(RDF.List.getURI())) {
                    r.addProperty(p, decodeList(vala));
                } else {
                    for (int i = 0; i < vala.length(); i++) {
                        r.addProperty(p, decodeNode( vala.get(i), range ));
                    }
                }
            } else {
                r.addProperty(p, decodeNode(val, range));
            }
        }
        return r;
    }
    
    protected RDFNode decodeNode(Object val, String type) throws JSONException {
        if (val instanceof JSONObject) {
            return decodeResource((JSONObject) val);
        } else if (val instanceof JSONArray) {
            return decodeList( (JSONArray)val );
        } else {
            return encoder.decodeValue(val, this, type);
        }
    }
    
    protected RDFNode decodeList(JSONArray array) throws JSONException {
        RDFNode[] listContents = new RDFNode[ array.length() ];
        for (int i = 0; i < array.length(); i++) {
            listContents[i] =  decodeNode(array.get(i), null);
        }
        return model.createList(listContents);
    }
    
    public Resource bNodeForID(String id) {
        if (id == null) {
            return model.createResource();
        } else { 
            return bNodeForID( Integer.parseInt(id.substring(2)) );
        }
    }
    
    public Resource bNodeForID(int id) {
        Resource bNode = bNodes.get(id);
        if (bNode == null) {
            bNode = model.createResource();
            bNodes.put(id, bNode);
        }
        return bNode;
    }
    
    public Resource resourceForURI(String uri) {
        return model.createResource( context.exapandURIfromName(uri) );
    }
    

}
