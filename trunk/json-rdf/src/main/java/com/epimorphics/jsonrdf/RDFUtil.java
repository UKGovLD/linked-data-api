/******************************************************************
 * File:        RDFUtil.java
 * Created by:  Dave Reynolds
 * Created on:  27 Dec 2009
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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import com.hp.hpl.jena.datatypes.xsd.XSDDatatype;
import com.hp.hpl.jena.datatypes.xsd.XSDDateTime;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.ResourceFactory;
import com.hp.hpl.jena.vocabulary.RDF;
import com.hp.hpl.jena.vocabulary.XSD;

public class RDFUtil {

    public static final String RDFPlainLiteral = RDF.getURI() + "PlainLiteral";

    /**
     * test if a node corresponds to an RDF List
     */
    public static boolean isList(RDFNode value) {
        return value.isAnon() &&
                (  ((Resource) value).hasProperty(RDF.type, RDF.List)
                 || ((Resource)value).hasProperty(RDF.first)
                );
    }

    public static final SimpleDateFormat dateFormat = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss 'GMT'Z");
    public static final SimpleDateFormat xsdDateFormat = new SimpleDateFormat("yyyy-MM-dd");
    static {
        dateFormat.setTimeZone( TimeZone.getTimeZone("GMT"));
    }
    
    /**
     * Convert an xsd:datetype or xsd:date to a javascript compatible string.
     * Returns null if not a supported type
     */
    public static String formatDateTime(Literal l) {
        Object val = l.getValue();
        if (val instanceof XSDDateTime) {
            Date date =  ((XSDDateTime)val).asCalendar().getTime();
            return dateFormat.format(date);
        } else {
            return null;
        }
    }
    
    /**
     * Convert an javascript date string to an xsd:datetime or xsd:date
     * @throws ParseException 
     */
    public static Literal parseDateTime(String lex, String type) throws ParseException {
        Date date = dateFormat.parse(lex);
        if (XSD.date.getURI().equals(type)) {
            // Doing this by string hacking is evil but avoids dependence on Jena innards
            return ResourceFactory.createTypedLiteral(xsdDateFormat.format(date), XSDDatatype.XSDdate);
        } else {
            // Default to dateTime
            // Note this loses time zone info, don't know how get parser to extract that
            Calendar cal  = Calendar.getInstance( TimeZone.getTimeZone("GMT") );
            cal.setTime(date);
            XSDDateTime dt = new XSDDateTime(cal);
            return ResourceFactory.createTypedLiteral( dt );
        }
    }
}
