/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        EncoderDefault.java
    Created by:  Dave Reynolds
    Created on:  21 Dec 2009
*/

package com.epimorphics.jsonrdf.impl;

import java.math.BigDecimal;
import java.text.ParseException;
import java.util.Iterator;

import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonBoolean;
import org.openjena.atlas.json.JsonException;
import org.openjena.atlas.json.JsonNumber;
import org.openjena.atlas.json.JsonObject;
import org.openjena.atlas.json.JsonString;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.epimorphics.jsonrdf.Context;
import com.epimorphics.jsonrdf.Decoder;
import com.epimorphics.jsonrdf.EncoderPlugin;
import com.epimorphics.jsonrdf.EncodingException;
import com.epimorphics.jsonrdf.JSONWriterFacade;
import com.epimorphics.jsonrdf.RDFUtil;
import com.epimorphics.jsonrdf.extras.JsonUtils;
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
    
    static Logger log = LoggerFactory.getLogger(EncoderDefault.class);
    
    /** String used as the property name for identifying resources */
    @Override public String getPNResourceID() {
//        return "@";
        return "_about";
    }
    
    /** name of format */
    public static final String Format = "linked-data-api"; 
    
    /** version number of format */
    public static final String Version = "0.2"; 
    
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
    
    /** property name for the single-valued content/results property  */    
    public static final String PNOneResult  = "result"; 
    
    /** property name for the named graphs property */    
    public static final String PNgraphs  = "graphs"; 
    
    /** Encode a resource URI */
    @Override public String encodeResourceURI(String uri) {
        return uri;
    }
    
    /** Encode a resource URI, shortening it if possible */
    @Override public String encodeResourceURI(String uri, Context context, boolean shorten) {
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
    @Override public String decodeResourceURI(String code, Context context) {
        if (code.startsWith("<") && code.endsWith(">")) {
            String relUri = code.substring(1, code.length()-1);
            return context.getBase() + relUri;
        } else {
            String uri = context.getURIfromName(code);
            return (uri == null) ? code : uri;
        }
    }
    
    /** Encode a reference to a bNode via a mapped identifier number */
    @Override public String encodebNodeId(int id) {
        return "_:" + id;
    }
    
    /** Encode a literal as a JSON compatible object */
    @Override public void encodeLiteral( JSONWriterFacade jw, boolean isStructured, Literal lit, Context c) {
    	String spelling = lit.getLexicalForm(), lang = lit.getLanguage();
    	RDFDatatype dt = lit.getDatatype();
    	if (isStructured) {
    		jw.object();
    		jw.key("_value"); jw.value( spelling );
    		if (dt != null) { jw.key( "_datatype" ); jw.value( shortName( c, dt ) ); }
    		if (lang.length() > 0) { jw.key("_lang" ); jw.value( lang ); }
    		jw.endObject();    		
    	} else {
			if (dt == null) {
				encodeString( jw, spelling, lang );
			} else if (dt.equals( XSDDatatype.XSDboolean)) {
				jw.value( (boolean) ((Boolean) lit.getValue()) );
			} else if (isFloatLike(dt)) {
				jw.value( Double.parseDouble( spelling ) );
			} else if (dt instanceof XSDBaseNumericType) {
				jw.value( Long.parseLong( spelling ) );
	        } else if (dt.equals( XSDDatatype.XSDdateTime) || dt.equals( XSDDatatype.XSDdate) ) {
	        	jw.value( RDFUtil.formatDateTime( lit ) );
	        } else if (dt.equals( XSDDatatype.XSDanyURI)) {
	            jw.value( spelling );
	        } else if (dt.equals( XSDDatatype.XSDstring) ) { 
	            jw.value( spelling ); // ISSUE with escaping things -- hangover?
			} else {
				if (showUnhandled)
					{
					log.warn( "unhandled datatype '" + dt + "' in literal '" + spelling + "'" );
					showUnhandled = false;
					}
				jw.value( spelling );
			}
    	}
    }
    
    private boolean showUnhandled = true;

	private String shortName( Context c, RDFDatatype dt) {
		String sn = c.getNameForURI( dt.getURI() );
		if (sn == null) throw new EncodingException( "could not find shortname for datatype " + dt.getURI() );
		return sn;
	}

	private boolean isFloatLike(RDFDatatype dt) {
		return dt.equals( XSDDatatype.XSDfloat) 
			|| dt.equals( XSDDatatype.XSDdouble) 
			|| dt.equals( XSDDatatype.XSDdecimal);
	}

	private void encodeString(JSONWriterFacade jw, String lex, String lang ) {
        // WAS: jw.value( lang.isEmpty() ? lex : lex + "@" + lang );
		// (suppressing language tags)
		jw.value( lex );
    }

    /** Write the context object to a JSON stream */
    @Override public void writeContext(Context context, JSONWriterFacade jw) {
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
        return lex; // TODO fix global issue lex.replaceAll("([@\\^\\\\<])", "\\\\$1");
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
    @Override public void writeHeader(JSONWriterFacade jw)  {
        jw.object()
        	.key(PNFormat).value(Format)
        	.key(PNVersion).value(Version);
    }
    
    /**
     * Writer header for a results/model array object
     */
    @Override public void startResults(JSONWriterFacade jw, boolean oneResult )  {
        if (oneResult) jw.key(PNOneResult);
        else jw.key(PNContent).array();
    }

	@Override public void endResults(JSONWriterFacade jw, boolean oneResult ) {
		if (!oneResult) jw.endArray();		
	}
    
    /** Start a sub-section for outputing named graphs */
    @Override public void startNamedGraphs(JSONWriterFacade jw)  {
        jw.key(PNgraphs).array();
    }
    
    /** Start a specific named graph */
    @Override public void startNamedGraph(JSONWriterFacade jw, String name)  {
        jw.object();
        jw.key(getPNResourceID()).value(encodeResourceURI(name));
    }
    
    /** Finish a specific named graph */
    @Override public void finishNamedGraph(JSONWriterFacade jw)  {
        jw.endObject();
    }
    
    /** Finish the entire second of named graphs, assumes last graph has been closed */
    @Override public void finishNamedGraphs(JSONWriterFacade jw)  {
        jw.endArray();
    }
    
    /** Return the array of encoded graphs from a top level JSON results set, or null if there is none */
    @Override public JsonArray getNamedGraphs(JsonObject jobj) throws JsonException {
        return JsonUtils.getArray(jobj, PNgraphs);
    }
    
    /** Return the name of a named graph */
    @Override public String getGraphName(JsonObject graph, Context context) throws JsonException {
        return decodeResourceURI( JsonUtils.getString(graph, getPNResourceID()), context );
    }
    
    /** Extract the context part of a deserialized JSON object  */
    @Override public Context getContext(JsonObject jObj) throws JsonException {
        String format = JsonUtils.getString(jObj, PNFormat);
		String version = JsonUtils.getString(jObj, PNVersion);
		if (format.equals(Format) && version.equals(Version)) {
            return getEmbeddedContext(jObj);
        } else {
            throw new EncodingException("Format and version didn't match. Expecting: " + Format + " - " + Version + " but got " + format + " - " + version );
        }
    }
    
    /** Extract the context part of an embedded deserialized JSON object, no version checks  */
	@Override public Context getEmbeddedContext(JsonObject jObj) throws JsonException {
    	JsonObject cObj = jObj.get(PNContext).getAsObject();
        Context context = new Context(JsonUtils.optString(cObj, PNbase, null));
        JsonObject mapping = cObj.get(PNMapping).getAsObject();
        Iterator<String> keys = mapping.keys().iterator();
        while (keys.hasNext()) {
            String key = keys.next();
            JsonObject map = mapping.get(key).getAsObject();
            String uri = JsonUtils.optString( map, PNuri, null );
            String range = JsonUtils.optString( map, PNrange, null );
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
    @Override public JsonArray getResults(JsonObject jobj) throws JsonException {
        return JsonUtils.getArray(jobj, PNContent);
    }
    
    /** Decode an RDF value (object of a statement) */
    @Override public RDFNode decodeValue(Object jsonValue, Decoder decoder, String type) {
        if (jsonValue instanceof Number) {
            return ResourceFactory.createTypedLiteral(jsonValue);
        } else if (jsonValue instanceof JsonBoolean) {
        	JsonBoolean jb = (JsonBoolean) jsonValue;
        	return ResourceFactory.createTypedLiteral( jb.value() );
        } else if (jsonValue instanceof JsonNumber) {
        	return decodeNumber( (JsonNumber) jsonValue );
        } else if (jsonValue instanceof Boolean) {
            return ResourceFactory.createTypedLiteral(jsonValue);
        } else if (jsonValue instanceof JsonString) {
        	return decodeValue( ((JsonString) jsonValue).value(), decoder, type );
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
        throw new EncodingException("Don't recogize object value: " + jsonValue + " [class " + jsonValue.getClass().getSimpleName() + "]" );
    }

	private RDFNode decodeNumber( JsonNumber jn ) {
		BigDecimal bd = (BigDecimal) jn.value();
		try { return ResourceFactory.createTypedLiteral( bd.intValueExact() ); }
		catch (ArithmeticException e) { /* fall through on exception */ }
		try { return ResourceFactory.createTypedLiteral( bd.longValueExact() ); }
		catch (ArithmeticException e) { /* fall through on exception */ }
		try { return ResourceFactory.createTypedLiteral( bd.doubleValue() ); }
		catch (ArithmeticException e) { /* fall through on exception */ }
		return ResourceFactory.createTypedLiteral( bd );
	}

}

