/******************************************************************
 * File:        Context.java
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

import static com.epimorphics.jsonrdf.RDFUtil.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import com.epimorphics.vocabs.API;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.ResIterator;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.impl.Util;
import com.hp.hpl.jena.shared.PrefixMapping;
import com.hp.hpl.jena.vocabulary.OWL;
import com.hp.hpl.jena.vocabulary.RDF;
import com.hp.hpl.jena.vocabulary.RDFS;

/**
 * Encapsulates the mapping decisions to determine how RDF should be
 * serialized in JSON to enable partial inversion. The source context
 * information may be manually or automatically generated.
 * The context itself should serializable in JSON to enable (partial)
 * round tripping.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class Context {

    protected String base;
    protected Map<String, Prop> uriToProp = new HashMap<String, Prop>();
    protected Map<String, String> uriToName = new HashMap<String, String>();
    protected Map<String, String> nameToURI = new HashMap<String, String>();
    protected int nameCount = 0;
    protected boolean sortProperties = false;
    protected boolean completedMappingTable = false;
    
    /**
     * Construct an empty context
     */
    public Context() {
        base = null;
    }
    
    /**
     * Construct a context, initialized from an ontology.
     * @param ontology ontology model used for naming, and annotation to control serializations
     */
    public Context(Model ontology) {
        loadVocabularyAnnotations(ontology);
    }
    
    /**
     * Construct a context with a defined base URI
     * @param base URI used for relative referencing
     */
    public Context(String base) {
        this.base = base;
    }

    /**
     * Construct context with both a base and an ontology defined. 
     * @param base URI used for relative referencing
     * @param ontology ontology model used for naming, and annotation to control serializations
     */
    public Context(String base, Model ontology) {
        this.base = base;
        loadVocabularyAnnotations(ontology);
    }

    /**
     * Scan the given vocabulary file to find shortname and property type
     * annotations
     */
    public void loadVocabularyAnnotations(Model m, PrefixMapping prefixes) {                
        for(Resource r : RES_TYPES_TO_SHORTEN) 
            loadAnnotations(m, m.listSubjectsWithProperty(RDF.type, r), false, prefixes);
        for(Resource r : PROP_TYPES_TO_SHORTEN) 
            loadAnnotations(m, m.listSubjectsWithProperty(RDF.type, r), true, prefixes);
        loadAnnotations(m, m.listSubjectsWithProperty(API.label), false, prefixes);
    }
    static Resource[] RES_TYPES_TO_SHORTEN = new Resource[] {RDFS.Class, OWL.Class};
        // TODO add SKOS
    static Resource[] PROP_TYPES_TO_SHORTEN = new Resource[] {RDF.Property, OWL.DatatypeProperty, OWL.ObjectProperty, API.Hidden};
    static Pattern labelPattern = Pattern.compile("[_a-zA-Z][0-9a-zA-Z_]*");
    
    protected void loadAnnotations(Model m, ResIterator ri, boolean isProperty, PrefixMapping prefixes) {
        while (ri.hasNext()) {
            Resource res = ri.next();
            String uri = res.getURI();
            String shortform = null;
            if (uri != null) {
                recordAltName(uri, prefixes);
                if (res.hasProperty(API.label)) {
                    shortform = getStringValue(res, API.label);
                    recordPreferredName(shortform, uri);
                } else if (res.hasProperty(RDFS.label)) {
                    shortform = getStringValue(res, RDFS.label);
                    if (labelPattern.matcher(shortform).matches()) {
                        recordPreferredName(shortform, uri);
                    }
                }
                if (isProperty) {
                    // Make sure there is a property record of some sort
                    if (shortform == null) shortform = getLocalName(uri);
                    createPropertyRecord(shortform, res);
                }
            }
        }
    }
    
    public void loadVocabularyAnnotations(Model m) {
        loadVocabularyAnnotations(m, m);
    }
    
    /**
     * Record the preferred name to use to shorten a URI.
     * If the name is already in use then only record as an alternate name
     */
    public void recordPreferredName(String name, String uri) {
        if (isNameFree(name)) {
            nameToURI.put(name, uri);
            uriToName.put(uri, name);
            Prop prop = uriToProp.get(uri);
            if (prop != null && !prop.getName().equals(name)) {
                prop.setName(name);
            }
        } 
    }
    
    protected void createPropertyRecord(String name, Resource res) {
        String uri = res.getURI();
        Prop prop = uriToProp.get(uri);
        if (prop == null) {
            prop = makeProp(uri, name);
            uriToProp.put(uri, prop);
        }
        if (res.hasProperty(RDF.type, API.Multivalued)) 
            prop.setMultivalued(true);
        if (res.hasProperty(RDF.type, API.Hidden))
            prop.setHidden(true);
        String typeURI = getStringValue(res, RDFS.range);
        if (typeURI != null)
            prop.setType(typeURI);
    }
    
    /**
     * Record an alternative named to use to to shorted a URI.
     * Will only be used when expanding queries, not for generation of shortform listings
     */
    protected void recordAltName(String name, String uri) {
        if ( ! nameToURI.containsKey(name))
            nameToURI.put(name, uri);
        // Only the preferred name goes in the uriToName mapping
    }
    
    protected void recordAltName(String uri, PrefixMapping pm) {
        // Note local name
        recordAltName(getLocalName(uri), uri );
        // Note prefixed name
        String sf = pm.shortForm(uri);
        if ( ! sf.equals(uri)) {
            sf = sf.replace(':', '_');
        }
        recordAltName(sf, uri);
    }

    protected String getLocalName(String uri) {
        return uri.substring( Util.splitNamespace( uri ));
    }

    /**
     * Finish off the mapping table filling in anything we have useful prefixes for
     * and inventing non-clashing forms.
     */
    protected void completeContext() {
        if ( !completedMappingTable ) {
            completedMappingTable = true;
            for (Map.Entry<String, String> e : nameToURI.entrySet()) {
                String uri = e.getValue();
                String name = e.getKey();
                if ( ! uriToName.containsKey(uri)) {
                    uriToName.put(uri, name);
                }
            }
        }
    }
    
    /** Return the base URI assumed during serialization */
    public String getBase() {
        return base;
    }

    /** Set the base URI */
    public void setBase(String base) {
        this.base = base;
    }
    
    /** Set flag to indicate if properties should be sorted in the encoding */
    public void setSorted(boolean sorted) {
        this.sortProperties = sorted;
    }
    
    public boolean isSortProperties() {
        return sortProperties;
    }
    
    /** The set of all mapped names */
    public Set<String> allNames() {
        return nameToURI.keySet();
    }
    
    /** Lookup the definition of a property based on its URI */
    public Prop getPropertyByURI(String uri) {
        return uriToProp.get(uri);
    }
    
    /** Lookup the definition of a property based on its mapped name */
    public Prop getPropertyByName(String name) {
        return getPropertyByURI( getURIfromName(name) );
    }
    
    /** Lookup the shortened form for a URI, can apply to non-properties (e.g. classes) as well as properties */
    public String getNameForURI(String uri) {
        completeContext();
        return uriToName.get(uri);
    }
    
    /** Lookup the URI for a shortened name. Returns null if no mapping is known */
    public String getURIfromName(String name) {
        completeContext();
        return nameToURI.get(name);
    }
    
    /**
     * Determine an appropriate name for a property resource, creating a new
     * context entry if required. 
     */
    protected String findNameForProperty(Resource r) {
        String uri = r.getURI();
        String name = getNameForURI( uri );
        if (name == null) {
            // Try just using localname
            String localname = r.getLocalName(); 
            if ( nameUpdateOK(localname, uri) ) return localname;
            
            // See if we can generate a prefix form
            name = r.getModel().shortForm(uri);
            if (! name.equals(uri)) {
                name = name.replace(':', '_');
                if ( nameUpdateOK(name, uri) ) return name;
            }
            
            // Start making ones up as a last resort
            while (true) {
                name = localname + nameCount++;
                if ( nameUpdateOK(name, uri) ) return name;
            }
        } else {
            return name;
        }
    }

    protected boolean nameUpdateOK(String name, String uri) {
        if (isNameFree(name)) {
            recordPreferredName(name, uri);
            return true;
        }
        return false;
    }

    /**
     * Determine record for a property, creating a new
     * context entry if required.
     */
    public Prop findProperty(Property p) {
        String uri = p.getURI();
        Prop prop = getPropertyByURI(uri);
        if (prop == null) {
            String name = findNameForProperty(p);
            prop = getPropertyByURI(uri);
            if (prop == null) {
                prop = makeProp(uri, name);
                uriToProp.put(uri, prop);
            }
        }
        return prop;
    }
    
    /** Test if a name is not already in use */
    protected boolean isNameFree( String name ) {
        String uri = nameToURI.get(name);
        if (uri == null) {
            // No entry at all so it is definitely free
            return true;
        } else {
            // Might be a non-preferred entry
            String prefname = uriToName.get(uri);
            return (prefname == null) || (! prefname.equals(name));
        }
    }
    
    /**
     * Construct and register a Prop record for a newly named resource 
     */
    protected Prop makeProp(String uri, String name) {
        Prop prop = new Prop(uri, name);
        return prop;
    }
    
    /** Sub interface used to describe a mapped property */
    public static class Prop implements Comparable<Prop> {
        protected String uri;
        protected String name;
        protected boolean multivalued = false;
        protected boolean hidden = false;
        public boolean isHidden() {
            return hidden;
        }

        public void setHidden(boolean hidden) {
            this.hidden = hidden;
        }

        protected String type = null;
        protected Property p;
        
        public Prop(String uri, String name) {
            this.uri = uri;
            this.name = name;
        }
        
        /** The absolute URI of the property */
        public String getURI() {
            return uri;
        }
        
        /** The shortened name to use in serialization */
        public String getName() {
            return name;
        }
        
        /** True if the property should be treated as multi-valued */
        public boolean isMultivalued() {
            return multivalued;
        }
        
        public void setName(String name) {
            this.name = name;
        }

        public void setMultivalued(boolean multivalued) {
            this.multivalued = multivalued;
        }

        public void setType(String type) {
            this.type = type;
        }
        
        /** Record the type of a sample value, if there is a clash with prior type then default to rdfs:Resource */
        public void addType(RDFNode value) {
            if (type == null) {
                type = decideType(value);
            } else {
                String ty = decideType(value);
                if ( ! this.type.equals(ty) ) {
                    if (TypeUtil.isSubTypeOf(ty, type)) {
                        // Current type is OK
                    } if (TypeUtil.isSubTypeOf(type, ty)) {
                        type = ty;
                    } else {
                        // Generalize type
                        type = RDFS.Resource.getURI();
                    }
                }
            }
        }
        
        private String decideType(RDFNode value) {
            if (value instanceof Resource) {
                if (RDFUtil.isList(value) || value.equals(RDF.nil)) {
                    return RDF.List.getURI();
                } else {
                    return OWL.Thing.getURI();
                }
            } else {
                Literal l = (Literal)value;
                String ty = l.getDatatypeURI();
                if (ty == null || ty.isEmpty()) {
                    return RDFUtil.RDFPlainLiteral;
                } else {
                    return ty;
                }
            }
        }

        /** Returns the assumed range of the property as a URI. Values with particular
         * significance for the serialization are rdfs:Resource, rdfs:List and xsd:* */
        public String getType() {
            return type;
        }
        
        /** Get the corresponding RDF property, may cache */
        public Property getProperty(Model m) {
            if (p == null) {
                p = m.getProperty(uri);
            }
            return p;
        }

        /**
         * Compare on names to permit sorting.
         */
        @Override
        public int compareTo(Prop o) {
           return name.compareTo(o.name);     
        }
    }

    public void setProperty(String uri, Prop prop) {
        uriToProp.put(uri, prop);
        String name = prop.getName();
        recordPreferredName(name, uri);  // False to isProperty because we are registering an externally created prop ourselves
    }
    
}

