/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        Decoder.java
    Created by:  Dave Reynolds
    Created on:  23 Dec 2009
*/

package com.epimorphics.jsonrdf;

import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonException;
import org.openjena.atlas.json.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.epimorphics.jsonrdf.extras.JsonUtils;
import com.epimorphics.jsonrdf.impl.EncoderDefault;
import com.hp.hpl.jena.query.DataSource;
import com.hp.hpl.jena.query.DatasetFactory;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.vocabulary.RDF;
import com.hp.hpl.jena.vocabulary.RDFS;

public class Decoder {

    static Logger log = LoggerFactory.getLogger(Decoder.class);
    
    protected static EncoderPlugin encoder = new EncoderDefault() ;
    
    /**
     * Decode a JSON object from the reader into a set of resources within
     * a reconstructed RDF Model. Using an exernally supplied context to translate the
     * name abbreviations.
     * @throws EncodingException if there is a jsonrdf level error or JSON error
     */
    public static List<Resource> decode(Context context, Reader reader) {
        
        try {
            JsonObject jObj = ParseWrapper.readerToJsonObject(reader);
            return new Decoder(context, jObj).decodeResources();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        } 
    }
    
    /**
     * Decode a JSON object from the reader into a set of resources within
     * a reconstructed RDF Model.
     * @throws EncodingException if there is a jsonrdf level error or JSON error
     */
    public static List<Resource> decode(Reader reader) {
        
        try {
            JsonObject jObj = ParseWrapper.readerToJsonObject(reader);
            Context context = encoder.getContext(jObj);
            return new Decoder(context, jObj).decodeResources();
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        } 
    }
    
    protected final static int BUFLEN = 1000;
    protected static String readFull(Reader reader) throws IOException {
        StringBuffer whole = new StringBuffer();
        char[] buff = new char[BUFLEN];
        int len = 0;
        while ((len = reader.read(buff)) != -1) {
            whole.append(buff, 0, len);
        }
        return whole.toString();
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
            JsonObject jObj = ParseWrapper.readerToJsonObject(reader);
            Context context = encoder.getContext(jObj);
            Model def = modelFromRoots( new Decoder(context, jObj).decodeResources() );
            DataSource set = DatasetFactory.create(def);
            JsonArray graphs = encoder.getNamedGraphs(jObj);
            if (graphs != null) {
                for (int i = 0; i < graphs.size(); i++) {
                    JsonObject graph = graphs.get(i).getAsObject();
                    String name = encoder.getGraphName(graph, context);
                    Model model = modelFromRoots( new Decoder(context, graph).decodeResources() );
                    set.addNamedModel(name, model);
                }
            }
            return set;
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }
    
    protected Context context;
    protected JsonObject j;
    protected Model model = ModelFactory.createDefaultModel();
    protected Map<Integer, Resource> bNodes = new HashMap<Integer, Resource>();
    
    public Decoder(Context context, JsonObject jObj) {
        this.context = context;
        this.j = jObj;
    }
    
    public List<Resource> decodeResources() throws JsonException {
        JsonArray results = encoder.getResults(j);
        List<Resource> roots = new ArrayList<Resource>();
        
        int len = results.size();
        for (int i = 0; i < len; i++) {
            roots.add( decodeResource(results.get(i).getAsObject()));
        }
        return roots;
    }
    
    Resource decodeResource(JsonObject rObj) throws JsonException {
        String uriCode = JsonUtils.optString( rObj, encoder.getPNResourceID(), null );
        Resource r = (uriCode == null || uriCode.startsWith("_:")) 
                        ? bNodeForID( uriCode ) 
                        : resourceForURI( encoder.decodeResourceURI(uriCode, context) );
        Iterator<String> keys = rObj.keys().iterator();
        while(keys.hasNext()) {
            String key = keys.next();
            if (key.equals( encoder.getPNResourceID()) ) continue;
            
            Context.Prop prop = context.getPropertyByName(key);
            Property p = null;
            if (prop == null) {
                String uri = context.getURIfromName(key);
                if (uri == null) {
                    log.error("Can't decode property: " + key);
                    uri = "http://www.epimoprhics.com/badkey/" + key;
                }
                p = model.getProperty(uri);
            } else {
                p = prop.getProperty(model);
            }
            String range = (prop == null) ? RDFS.Resource.getURI() : prop.getType();
            Object val = rObj.get(key);
            if (val instanceof JsonArray) {
                JsonArray vala = (JsonArray)val;
                if (prop != null && prop.getType().equals(RDF.List.getURI())) {
                    r.addProperty(p, decodeList(vala));
                } else if (vala.size() == 0) {
                    r.addProperty(p, RDF.nil);
                } else {
                    for (int i = 0; i < vala.size(); i++) {
                        r.addProperty(p, decodeNode( vala.get(i), range ));
                    }
                }
            } else {
                r.addProperty(p, decodeNode(val, range));
            }
        }
        return r;
    }
    
    protected RDFNode decodeNode(Object val, String type) throws JsonException {
        if (val instanceof JsonObject) {
            JsonObject jo = (JsonObject) val;
            return jo.hasKey( "_value" ) ? decodeStructuredLiteral(jo) :  decodeResource(jo);
        } else if (val instanceof JsonArray) {
            return decodeList( (JsonArray)val );
        } else {
            return encoder.decodeValue(val, this, type);
        }
    }
    
    private Literal decodeStructuredLiteral(JsonObject jo) {
		String spelling = JsonUtils.optString( jo, "_value", "" );
		String lang = JsonUtils.optString( jo, "_lang", "" );
		String type = JsonUtils.optString( jo, "_datatype", "" );
		return
			lang.isEmpty() ? model.createTypedLiteral( spelling, decodeTypeURI( type ) ) 
			: model.createLiteral( spelling, lang )
			;
	}

	private String decodeTypeURI( String shortName ) {
		return resourceForURI( shortName ).getURI();
	}

	protected RDFNode decodeList(JsonArray array) throws JsonException {
        if (array.size() == 0) {
            return RDF.nil;
        } else {
            RDFNode[] listContents = new RDFNode[ array.size() ];
            for (int i = 0; i < array.size(); i++) {
                listContents[i] =  decodeNode(array.get(i), null);
            }
            return model.createList(listContents);
        }
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
//        return model.createResource( context.exapandURIfromName(uri) );
        // TODO check
        return model.createResource( encoder.decodeResourceURI(uri, context) );
    }
    

}
