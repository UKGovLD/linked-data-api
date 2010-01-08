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

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.util.iterator.ExtendedIterator;
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
    protected Model ontology;
    protected boolean sortProperties = false;
    
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
        this.ontology = ontology;
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
        this.ontology = ontology;
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
    
    /** Assign a property definition to a property URI */
    public void setProperty(String uri, Prop prop) {
        String name = prop.getName();
        if (name != null) {
            setName(uri, name);
        }
        uriToProp.put(uri, prop);
    }
    
    /** Lookup the shortened form for a URI, can apply to non-properties (e.g. classes) as well as properties */
    public String getNameForURI(String uri) {
        return uriToName.get(uri);
    }
    
    /** Lookup the URI for a shortened name. Returns null if no mapping is known */
    public String getURIfromName(String name) {
        return nameToURI.get(name);
    }
        
    /** Lookup the URI for a shortened name. Returns name if no mapping is known */
    public String exapandURIfromName(String name) {
        String uri = getURIfromName(name);
        if (uri == null) {
            if (getBase() != null) {
                return getBase() + name;
            } else {
                return name;
            }
        } 
        return uri;
    }
    
    /** Assign a shortened name for a URI. 
     */
    public void setName(String uri, String name) {
        String currName = getNameForURI(uri);
        if (currName != null && !currName.equals(name)) {
            throw new EncodingException("Name already assigned: " + name);
        }
        String currUri = getURIfromName(name);
        if (currUri != null && !currUri.equals(uri)) {
            throw new EncodingException("URI already assigned different name: " + uri);
        }
        nameToURI.put(name, uri);
        uriToName.put(uri, name);
    }

    /**
     * Determine an appropriate name for a uri resource, creating a new
     * context entry if required. Assumes that the resource is "in" the
     * model containing relevant naming information.
     */
    public String findNameForResource(Resource r) {
        String uri = r.getURI();
        String name = getNameForURI(uri);
        if (name == null) {
            // Try URI relative to base
            if (base != null && ! base.isEmpty() && uri.startsWith(base)) {
                name = uri.substring(base.length());
                if (isNameFree(name)) {
                    return name;
                }
            }
            return null;  // No natural name
        } else {
            return name;
        }
    }
    
    /**
     * Find the right name representation for a non-property resource
     */
    public String findResource(Resource r) {
        String name = findNameForResource(r);
        return (name == null) ? r.getURI() : name;
    }

    /**
     * Determine an appropriate name for a property resource, creating a new
     * context entry if required. Assumes that the resource is "in" the
     * model containing relevant naming information.
     */
    public String findNameForProperty(Resource r) {
        String name = findNameForResource(r);
        if (name == null) {
            // No assignment yet, invent one if appropriate
            // Best option - find a label from the ontology or model
            ExtendedIterator<RDFNode> ni = r.getModel().listObjectsOfProperty(r, RDFS.label);
            if (ontology != null) {
                ni = ontology.listObjectsOfProperty(r, RDFS.label).andThen( ni );
            }
            while (ni.hasNext()) {
                RDFNode lnode = ni.next();
                if (lnode.isLiteral()) {
                    name = ((Literal)lnode).getLexicalForm();
                    if (isNameFree(name)) {
                        setName(r.getURI(), name);
                        return name;
                    }
                }
            }
            // Try localname
            name = r.getLocalName();
            if (!name.isEmpty() && isNameFree(name))  return name;
            // Start making up names
            while (true) {
                name = "P" + nameCount++;
                if (isNameFree(name)) return name;
            }
        } else {
            return name;
        }
    }

    /**
     * Determine an appropriate name for a property, creating a new
     * context entry if required. Assumes that the resource is "in" the
     * model containing relevant naming information.
     */
    public Prop findProperty(Property p) {
        String uri = p.getURI();
        Prop prop = getPropertyByURI(uri);
        if (prop == null) {
            String name = findNameForProperty(p);
            prop = makeProp(uri, name);
            if (ontology != null) {
                prop.setMultivalued(ontology.contains(p, RDF.type, LDA.Multivalued));
                prop.setHidden(ontology.contains(p, RDF.type, LDA.Hidden));
            }
        }
        return prop;
    }
    
    /** Test if a name is not already in use */
    public boolean isNameFree( String name ) {
        return ! nameToURI.containsKey(name);
    }
    
    /**
     * Construct and register a Prop record for a newly named resource 
     */
    Prop makeProp(String uri, String name) {
        Prop prop = new Prop(uri, name);
        setProperty(uri, prop);
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
            if (this.type == null) {
                this.type = decideType(value);
            } else {
                String ty = decideType(value);
                if ( ! this.type.equals(ty) ) {
                    this.type = RDFS.Resource.getURI();
                }
            }
        }
        
        private String decideType(RDFNode value) {
            if (value instanceof Resource) {
                if (RDFUtil.isList(value)) {
                    return RDF.List.getURI();
                }
                return OWL.Thing.getURI();
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
    
}

