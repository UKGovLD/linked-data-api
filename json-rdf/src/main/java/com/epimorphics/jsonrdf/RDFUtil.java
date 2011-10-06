/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
    
    File:        RDFUtil.java
    Created by:  Dave Reynolds
    Created on:  27 Dec 2009
*/

package com.epimorphics.jsonrdf;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;
import java.util.regex.Pattern;

import com.hp.hpl.jena.datatypes.xsd.XSDDatatype;
import com.hp.hpl.jena.datatypes.xsd.XSDDateTime;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.ResourceFactory;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.vocabulary.RDF;
import com.hp.hpl.jena.vocabulary.XSD;

public class RDFUtil {

    public static final String RDFPlainLiteral = RDF.getURI() + "PlainLiteral";

    /**
     * Return one of the values of the property on the resource in string form.
     * If there are no values return the defaultValue. If the value is not
     * a String but is a literal return it's lexical form. If it is a resource
     * return its URI. 
     */
    public static String getStringValue(Resource r, Property p, String defaultValue) {
        Statement s = r.getProperty(p);
        if (s == null) {
            return defaultValue;
        } else {
            return getLexicalForm( s.getObject() );
        }
    }

    /**
     * Return one of the values of the property on the resource in string form.
     * If there are no values return null.
     */
    public static String getStringValue(Resource r, Property p) {
        return getStringValue(r, p, null);
    }
    
    /**
     * Return the lexical form of a node. This is the lexical form of a
     * literal, the URI of a URIResource or the annonID of a bNode.
     */
    public static String getLexicalForm(RDFNode value) {
        if (value.isLiteral()) {
            return ((Literal)value).getLexicalForm();
        } else if (value.isURIResource()) {
            return ((Resource)value).getURI();
        } else {
            return value.toString();
        }
    }
    
    /**
     * test if a node corresponds to an RDF List
     */
    public static boolean isList(RDFNode value) {
        return value.isAnon() &&
                (  ((Resource) value).hasProperty(RDF.type, RDF.List)
                 || ((Resource)value).hasProperty(RDF.first)
                );
    }
    
    /**
        xsdDateFormat returns a SimpleDateFormat  in yyyy-MM-dd form.
        Note that synchronisation issues mean that we can't have a single
        shared constant -- it has mutable state.
    */

    protected static SimpleDateFormat xsdDateFormat() {
    	return new SimpleDateFormat( "yyyy-MM-dd" );
    }  

    /**
        xsdDateFormat returns a SimpleDateFormat  in "EEE, d MMM yyyy HH:mm:ss 'GMT'Z" 
        form, with the timezone set to GMT. Note that synchronisation issues 
        mean that we can't have a single shared constant -- it has mutable state.
    */
    protected static SimpleDateFormat dateFormat() {
    	SimpleDateFormat df = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss 'GMT'Z");
    	df.setTimeZone( TimeZone.getTimeZone( "GMT" ) );
    	return df;
    }
    
    /**
     * Convert an xsd:datetype or xsd:date to a javascript compatible string.
     * Returns null if not a supported type
     */
    public static String formatDateTime(Literal l) {
        Object val = l.getValue();
        if (val instanceof XSDDateTime) {
            Date date =  ((XSDDateTime)val).asCalendar().getTime();
            return dateFormat().format(date);
        } else {
            return null;
        }
    }
    
    /**
     * Convert an javascript date string to an xsd:datetime or xsd:date
     * @throws ParseException 
     */
    public static Literal parseDateTime(String lex, String type) throws ParseException {
        Date date = dateFormat().parse(lex);
        if (XSD.date.getURI().equals(type)) {
            // Doing this by string hacking is evil but avoids dependence on Jena innards
            return ResourceFactory.createTypedLiteral(xsdDateFormat().format(date), XSDDatatype.XSDdate);
        } else {
            // Default to dateTime
            // Note this loses time zone info, don't know how get parser to extract that
            Calendar cal  = Calendar.getInstance( TimeZone.getTimeZone("GMT") );
            cal.setTime(date);
            XSDDateTime dt = new XSDDateTime(cal);
            return ResourceFactory.createTypedLiteral( dt );
        }
    }
    
    
    /**
     * Check whether a string looks like an (absolute) URI
     */
    private static final Pattern uriPattern = Pattern.compile("(mailto:|file:|https?://|ftp://|urn:)\\S+");
    public static boolean looksLikeURI(String s) {
        return uriPattern.matcher(s).matches();
    }

}
