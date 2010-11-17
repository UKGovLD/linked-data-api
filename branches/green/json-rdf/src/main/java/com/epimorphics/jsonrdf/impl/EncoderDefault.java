/******************************************************************
 * File:        EncoderDefault.java
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

package com.epimorphics.jsonrdf.impl;

import java.text.ParseException;
import java.util.Iterator;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.epimorphics.jsonrdf.Context;
import com.epimorphics.jsonrdf.Decoder;
import com.epimorphics.jsonrdf.EncoderPlugin;
import com.epimorphics.jsonrdf.EncodingException;
import com.epimorphics.jsonrdf.JSONWriterFacade;
import com.epimorphics.jsonrdf.RDFUtil;
import com.hp.hpl.jena.datatypes.BaseDatatype;
import com.hp.hpl.jena.datatypes.RDFDatatype;
import com.hp.hpl.jena.datatypes.xsd.XSDDatatype;
import com.hp.hpl.jena.datatypes.xsd.impl.XSDBaseNumericType;
import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.ResourceFactory;
import com.hp.hpl.jena.rdf.model.impl.LiteralImpl;
import com.hp.hpl.jena.vocabulary.OWL;
import com.hp.hpl.jena.vocabulary.XSD;

/**
 * Implements the default encoding rules for converting RDF
 * resources to JSON.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class EncoderDefault implements EncoderPlugin {
    
    /** String used as the property name for identifying resources */
    public String getPNResourceID() {
//        return "@";
        return "_about";
    }
    
    /** name of format */
    public static final String Format = "linked-data-api"; 
    
    /** version number of format */
    public static final String Version = "0.1"; 
    
    /** property name for the format name property */    
    public static final String PNFormat = "format"; 

    /** property name for the format version property */    
    public static final String PNVersion = "version"; 
    
    /** property name for the context/mapping property */    
    public static final String PNContext = "context"; 
    
    /** property name for the name/URI mapping table within the context */
    public static final String PNMapping = "mapping";
    
    /** property name for the base entry in mapping table */
    public static final String PNbase = "base";
    
    /** property name for the uri entry in mapping table */
    public static final String PNuri = "uri";
    
    /** property name for the range value in the mapping table */
    public static final String PNrange = "range";
    
    /** property name for the content/results property */    
    public static final String PNContent  = "results"; 
    
    /** property name for the named graphs property */    
    public static final String PNgraphs  = "graphs"; 
    
    /** Encode a resource URI */
    public String encodeResourceURI(String uri) {
        return uri;
    }
    
    /** Encode a resource URI, shortening it if possible */
    public String encodeResourceURI(String uri, Context context, boolean shorten) {
        if (shorten) {
            String name = context.getNameForURI(uri);
            if (name != null) return name;
        }
        // Try URI relative to base
        String base = context.getBase();
        if (base != null && ! base.isEmpty() && uri.startsWith(base)) {
            String name = uri.substring(base.length());
            return "<" + name + ">";
        } else {
            return uri;
        }
    }
    
    /** Decode a resource URI */
    public String decodeResourceURI(String code, Context context) {
        if (code.startsWith("<") && code.endsWith(">")) {
            String relUri = code.substring(1, code.length()-1);
            return context.getBase() + relUri;
        } else {
            String uri = context.getURIfromName(code);
            return (uri == null) ? code : uri;
        }
    }
    
    /** Encode a reference to a bNode via a mapped identifier number */
    public String encodebNodeId(int id) {
        return "_:" + id;
    }
    
    /** Encode a literal as a JSON compatible object */
    public Object encode(Literal lit) {
        RDFDatatype dt = lit.getDatatype();
        if (dt == null) {
            String lex = escapeString(lit.getLexicalForm());
            String lang = lit.getLanguage();
            if (lang == null || lang.isEmpty()) {
                return lex;
            } else {
                return lex + "@" + lang;
            }
        } else if (dt.equals( XSDDatatype.XSDstring) ) { 
            return escapeString( lit.getLexicalForm() );
        } else if (dt instanceof XSDBaseNumericType || dt.equals( XSDDatatype.XSDfloat) || dt.equals( XSDDatatype.XSDdouble)) {
            // Basic numbers and floats
            // I believe that JSON API handles BigInteger and BigDecimal OK
            return lit.getValue();
        } else if (dt.equals( XSDDatatype.XSDboolean)) {
            return lit.getValue();
        } else if (dt.equals( XSDDatatype.XSDdateTime) || dt.equals( XSDDatatype.XSDdate) ) {
            return RDFUtil.formatDateTime(lit);
        } else if (dt.equals( XSDDatatype.XSDanyURI)) {
            return lit.getLexicalForm();
        } else if (dt.getURI().startsWith(XSD.getURI())) {
            return lit.getLexicalForm() + "^^xsd:" + dt.getURI().substring(XSD.getURI().length());
        } else {
            return lit.getLexicalForm() + "^^" + dt.getURI();
        }
    }

    /** Write the context object to a JSON stream */
    public void writeContext(Context context, JSONWriterFacade jw) {
        jw.key(PNContext);
        jw.object();
        String base = context.getBase();
        if (base != null && !base.isEmpty()) {
            jw.key(PNbase).value(base);
        }
        // Emit mappings
        jw.key(PNMapping);
        jw.object();
        for (String name : context.allNames()) {
            jw.key(name);
            jw.object();
            jw.key(PNuri).value( context.getURIfromName(name) );
            Context.Prop prop = context.getPropertyByName(name);
            if (prop != null) {
                if (prop.getType() != null)
                    jw.key(PNrange).value( prop.getType() );
            }
            jw.endObject();
        }
        jw.endObject();
        // end mappings
        jw.endObject();
    }

    /** 
     * Encode a string to protect characters used to encode types and lang tags.
     */
    public static String escapeString(String lex) {
        return lex.replaceAll("([@\\^\\\\<])", "\\\\$1");
    }
    
    /**
     * Decode a string to reverse escapement of meta characters
     */
    public static String unescapeString(String s) {
        return s.replaceAll("\\\\([@\\^\\\\<])", "$1");
    }
    
    /**
     * Write the outer result wrapper.
     */
    public void writeHeader(JSONWriterFacade jw)  {
        jw.object()
        .key(PNFormat).value(Format)
        .key(PNVersion).value(Version);
    }
    
    /**
     * Writer header for a results/model array object
     */
    public void startResults(JSONWriterFacade jw)  {
        jw.key(PNContent)
            .array();
    }
    
    /** Start a sub-section for outputing named graphs */
    public void startNamedGraphs(JSONWriterFacade jw)  {
        jw.key(PNgraphs);
        jw.array();
    }
    
    /** Start a specific named graph */
    public void startNamedGraph(JSONWriterFacade jw, String name)  {
        jw.object();
        jw.key(getPNResourceID()).value(encodeResourceURI(name));
    }
    
    /** Finish a specific named graph */
    public void finishNamedGraph(JSONWriterFacade jw)  {
        jw.endObject();
    }
    
    /** Finish the entire second of named graphs, assumes last graph has been closed */
    public void finishNamedGraphs(JSONWriterFacade jw)  {
        jw.endArray();
    }
    
    /** Return the array of encoded graphs from a top level JSON results set, or null if there is none */
    public JSONArray getNamedGraphs(JSONObject jobj) throws JSONException {
        return jobj.optJSONArray(PNgraphs);
    }
    
    /** Return the name of a named graph */
    public String getGraphName(JSONObject graph, Context context) throws JSONException {
        return decodeResourceURI( graph.getString(getPNResourceID()), context );
    }
    
    /** Extract the context part of a deserialized JSON object  */
    public Context getContext(JSONObject jObj) throws JSONException {
        if (jObj.getString(PNFormat).equals(Format) &&
                jObj.getString(PNVersion).equals(Version)) {
            return getEmbeddedContext(jObj);
        } else {
            throw new EncodingException("Format and version didn't match. Expecting: " + Format + " - " + Version);
        }
    }
    
    /** Extract the context part of an embedded deserialized JSON object, no version checks  */
    @SuppressWarnings("unchecked")
    public Context getEmbeddedContext(JSONObject jObj) throws JSONException {
        JSONObject cObj = jObj.getJSONObject(PNContext);
        Context context = new Context(cObj.optString(PNbase));
        JSONObject mapping = cObj.getJSONObject(PNMapping);
        Iterator<String> keys = mapping.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            JSONObject map = mapping.getJSONObject(key);
            String uri = map.optString(PNuri);
            String range = map.optString(PNrange);
            if (range != null) {
                Context.Prop prop = new Context.Prop(uri, key);
                prop.setType(range);
                context.setProperty(uri, prop);
            } else {
                context.recordPreferredName(key, uri);
            }
        }
        return context;
    }
    
    /** Extract the results part of a deserialized JSON object */
    public JSONArray getResults(JSONObject jobj) throws JSONException {
        return jobj.getJSONArray(PNContent);
    }
    
    /** Decode an RDF value (object of a statement) */
    public RDFNode decodeValue(Object jsonValue, Decoder decoder, String type) {
        if (jsonValue instanceof Number) {
            return ResourceFactory.createTypedLiteral(jsonValue);
        } if (jsonValue instanceof Boolean) {
            return ResourceFactory.createTypedLiteral(jsonValue);
        } else if (jsonValue instanceof String) {
            String lex = (String)jsonValue;  // Check for relative URIs before unescaping
            if (lex.startsWith("<") && lex.endsWith(">")) {
                return decoder.resourceForURI(lex);
            }
            lex = unescapeString( (String)jsonValue );
            if (lex.startsWith("_:")) {
                // Multi reference bNode 
                return decoder.bNodeForID( lex );
            } else if (OWL.Thing.getURI().equals(type)) {
                return decoder.resourceForURI(lex);
            } else if (lex.contains("^^")) { 
                int split = lex.indexOf("^^");
                String dtURI = lex.substring(split+2);
                lex = lex.substring(0, split);
                return ResourceFactory.createTypedLiteral(lex, new BaseDatatype(dtURI));
            } else if (XSD.anyURI.getURI().equals(type)) {
                return ResourceFactory.createTypedLiteral(lex, XSDDatatype.XSDanyURI);
            } else if (XSD.date.getURI().equals(type) || XSD.dateTime.getURI().equals(type)) {
                try {
                    return RDFUtil.parseDateTime(lex, type);
                } catch (ParseException e) {
                    throw new EncodingException("Badly formatted date/time: " + lex, e);
                }
            } else if (lex.contains("@")) {
                int split = lex.lastIndexOf('@');
                String lang = lex.substring(split+1);
                lex = lex.substring(0, split);
                return new LiteralImpl(Node.createLiteral(lex, lang, false), null);
            } else {
                return ResourceFactory.createPlainLiteral(lex);
            }
        }
        throw new EncodingException("Don't recogize object value: " + jsonValue);
    }


}

