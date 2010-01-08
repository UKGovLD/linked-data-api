/******************************************************************
 * File:        Encoder.java
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

import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;


import com.epimorphics.jsonrdf.impl.EncoderDefault;
import com.epimorphics.jsonrdf.org.json.JSONException;
import com.epimorphics.jsonrdf.org.json.JSONWriter;
import com.hp.hpl.jena.query.Dataset;
import com.hp.hpl.jena.rdf.model.AnonId;
import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.RDFList;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.ResIterator;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.rdf.model.StmtIterator;
import com.hp.hpl.jena.util.OneToManyMap;

/**
 * Driver for encoding a set of RDF resources into JSON.
 * The serialization decisions are made (relative to a Context spec)
 * by an EncoderPlugin for which there is a default implementation.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class Encoder {
    
    protected static EncoderPlugin defaultPlugin = new EncoderDefault();
 
    
    /**
     * Return an encoder using the default rules and no Context, any
     * Context information will be generated on-the-fly.
     */
    public static Encoder get() {
        return get(defaultPlugin);
    }
    
    /**
     * Return an encoder using the specified rules and no Context, any
     * Context information will be generated on-the-fly.
     */
    public static Encoder get(EncoderPlugin rules) {
        return get(rules, new Context());
    }
    
    /**
     * Return an encoder using the default rules and the specified 
     * base ontology.
     */
    public static Encoder get(Model ontology) {
        return get(defaultPlugin, ontology);
    }
    
    /**
     * Return an encoder using the specified rules and the specified 
     * base ontology.
     */
    public static Encoder get(EncoderPlugin rules, Model ontology) {
        return new Encoder(rules, new Context(ontology));
    }
    
    /**
     * Return an encoder using the default rules and the specified Context.
     */
    public static Encoder get(Context context) {
        return get(defaultPlugin, context);
    }
    
    /**
     * Return an encoder using the specified rules and the specified Context.
     */
    public static Encoder get(EncoderPlugin rules, Context context) {
        return new Encoder(rules, context);
    }

    /**
     * @param rules
     * @param context
     */
    private Encoder(EncoderPlugin rules, Context context) {
        this.rules = rules;
        this.context = context;
    }

    // Instance data
    protected EncoderPlugin rules;
    protected Context context;
    
    /**
     * Encode the whole of the given RDF model into the writer 
     * @param model The RDF to be encoded
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @throws IOException 
     */
    public void encode(Model model, Writer writer) throws IOException {
        encode(model, null, writer);
    }
    
    /**
     * Encode a list of resources from the given RDF model, only top level assertions and
     * bNode closures connected to them will be output.
     * @param model The RDF to be encoded
     * @param roots the root resources to be encoded
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @throws IOException 
     */
    public void encode(Model model, List<Resource> roots, Writer writer) throws IOException {
        encode(model, roots, writer, false);
    }
    
    /**
     * Encode a list of resources from the given RDF model, only top level assertions and
     * bNode closures connected to them will be output.
     * @param model The RDF to be encoded
     * @param roots the root resources to be encoded
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @param pretty set to true to pretty-print the json
     * @throws IOException 
     */
    public void encode(Model model, List<Resource> roots, Writer writer, boolean pretty) throws IOException {
        EncoderInstance ei = new EncoderInstance(model, writer);
        if (pretty) ei.setPrettyPrint(pretty);
        ei.encodeSingleModelRoots(roots, false);
    }
    
    /**
     * Encode a list of resources from the given RDF model, only top level assertions and
     * bNode closures connected to them will be output.
     * @param model The RDF to be encoded
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @param pretty set to true to pretty-print the json
     * @throws IOException 
     */
    public void encode(Model model, Writer writer, boolean pretty) throws IOException {
        encode(model, null, writer, pretty);
    }
    
    /**
     * Encode the given list of resources from the given model, plus any resources that those
     * roots reference - whether bNodes or URIs.
     * @param model The RDF to be encoded
     * @param roots the root resources from which encoding should start
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @param pretty set to true to pretty-print the json
     * @throws IOException 
     */
    public void encodeRecursive(Model model, List<Resource> roots, Writer writer, boolean pretty) {
        EncoderInstance ei = new EncoderInstance(model, writer);
        if (pretty) ei.setPrettyPrint(pretty);
        ei.encodeSingleModelRoots(roots, true);
    }
    
    /**
     * Encode the given list of resources from the given model, plus any resources that those
     * roots reference - whether bNodes or URIs.
     * @param model The RDF to be encoded
     * @param roots the root resources from which encoding should start
     * @param writer The output writer, ideally platform neutral charset like UTF-8
     * @throws IOException 
     */
    public void encodeRecursive(Model model, List<Resource> roots, Writer writer) {
        encodeRecursive(model, roots, writer, false);
    }
    
    /**
     * Write out a collection of named graphs plus a default graph
     * @param dataset the collection of models
     * @param writer writer to output to
     * @param roots the root resources to be encoded
     * @param pretty set to true to pretty-print the json
     * @throws IOException
     */
    public void encode(Dataset dataset, Writer writer, boolean pretty) throws IOException {
        try {
            EncoderInstance ei = new EncoderInstance(dataset.getDefaultModel(), writer);
            if (pretty) ei.setPrettyPrint(pretty);
            ei.startEncode();
            ei.encodeAll();
            ei.finishModelEncode();
            for (Iterator<String> i = dataset.listNames(); i.hasNext(); ) {
                String name = i.next();
                Model model = dataset.getNamedModel(name);
                ei.encodeNamedModel(name, model);
                // TODO Consider support for embedded contexts per-graph
            }
            ei.finishEncode();
        } catch (JSONException e) {
            throw new EncodingException(e.getMessage(), e);
        }
        
    }
    
    class EncoderInstance {
        protected Model model;
        protected JSONWriter jw;
        protected List<Resource> roots = new ArrayList<Resource>();
        protected int bnodeCount = 1;
        protected Map<AnonId, Integer> bNodes = new HashMap<AnonId, Integer>();
        protected boolean startedGraphs = false;
        protected boolean recurseOverResources = false;
        protected Set<Resource> encoded;
        
        public EncoderInstance(Model model, Writer w) {
            this.model = model;
            this.jw = new JSONWriter(w);
        }

        void setPrettyPrint(boolean pretty) {
            jw.setPrettyPrint(pretty);
        }
        
        /**
         * Encode a single model starting from the given roots.
         * @param roots The list of resources to write out (or at least start from), if this is null
         * then the whole model is written out.
         * @param recurse If true then all resources referenced from the roots will be written. 
         * @throws JSONException
         */
        void encodeSingleModelRoots(List<Resource> roots, boolean recurse) {
            if (recurse) {
                recurseOverResources = true;
                encoded = new HashSet<Resource>();
            }
            try {
                startEncode();
                encode(roots);
                finishModelEncode();
                finishEncode();
            } catch (JSONException e) {
                throw new EncodingException(e.getMessage(), e);
            }
        }
        
        private void noteResourceEncoded(Resource r) {
            if (recurseOverResources)
                encoded.add(r);
        }
        
        private void visitResource(Resource r) {
            if (recurseOverResources) {
                if (!encoded.contains(r)) {
                    roots.add(r);
                }
            }
        }
        
        private List<Resource> findRoots() {
            List<Resource> roots = new ArrayList<Resource>();
            for (ResIterator i = model.listSubjects(); i.hasNext(); ) {
                Resource r = i.next();
                if (r.isAnon() && model.contains(null, null, r))
                    continue;
                roots.add(r);
            }
            return roots;
        }
        
        private void encode( List<Resource> seedRoots ) throws JSONException {
            for ( Resource r : (seedRoots == null ? findRoots() : seedRoots) ) {
                encode(r);
            }
            while (!roots.isEmpty()) {
                List<Resource> newRoots = new ArrayList<Resource>( roots );
                roots.clear();
                for (Resource r : newRoots) 
                    encode(r);
                
            }
        }
        
        private void encodeAll() throws JSONException {
            encode( findRoots() );
        }
        
        void encodeNamedModel(String name, Model model) throws JSONException {
            this.model = model;     // side effect but only used for checking roots
            if (!startedGraphs) {
                startedGraphs = true;
                rules.startNamedGraphs(jw);
            }
            rules.startNamedGraph(jw, name);
            rules.startResults(jw);
            encodeAll();
            finishModelEncode();
            rules.finishNamedGraph(jw);
        }
        
        private void startEncode() throws JSONException {
            rules.writeHeader(jw);
            rules.startResults(jw);
        }
        
        private void finishModelEncode() throws JSONException {
            jw.endArray();
        }
        
        private void finishEncode() throws JSONException {
            if (startedGraphs) {
                rules.finishNamedGraphs(jw);
            }
            rules.writeContext(context, jw);
            jw.endObject();
        }
        
        private void encode(Resource r) throws JSONException {
            noteResourceEncoded(r);
            jw.object();
            if (r.isAnon()) {
                // Test if this is a root or single referenced bNode
                if ( isMultiplyReferencedbNode(r) ) {
                    int id = bNodeIdFor(r);
                    jw.key(rules.getPNResourceID()).value(rules.encodebNodeId(id));
                }
            } else {
                jw.key(rules.getPNResourceID())
                   .value(rules.encodeResourceURI(context.findResource(r)));
            }
            
            OneToManyMap<Property, RDFNode> vals = new OneToManyMap<Property, RDFNode>();
            for (StmtIterator si = r.listProperties(); si.hasNext(); ) {
                Statement s = si.next();
                vals.put(s.getPredicate(), s.getObject());
            }
            List<Property> props = new ArrayList<Property>(vals.keySet());
            if (context.isSortProperties()) {
                Collections.sort(props, new Comparator<Property>() {
                    @Override
                    public int compare(Property p1, Property p2) {
                        return context.findProperty(p1).compareTo(context.findProperty(p2));
                    }
                });
            }

            for (Property p : props) {
                Context.Prop prop = context.findProperty(p);
                if (prop.isHidden()) continue;
                jw.key(prop.getName());
                
                boolean first = true;
                boolean multi = prop.isMultivalued();
                for (Iterator<RDFNode> i = vals.getAll(p); i.hasNext(); ) {
                    RDFNode value = i.next();
                    prop.addType(value);
                    if (first) {
                        if (i.hasNext()) multi = true;
                        first = false;
                        if (multi) jw.array();
                    }
                    emitNode(value);
                }
                if (multi) jw.endArray();
            }
            jw.endObject();
        }

        private void emitNode(RDFNode valNode) throws JSONException {
            if (valNode.isLiteral()) {
                jw.value( rules.encode((Literal)valNode) );
            } else {
                Resource r = (Resource)valNode;
                if (r.isAnon()) {
                    if (RDFUtil.isList(r)) {
                        RDFList list = r.as(RDFList.class);
                        jw.array();
                        for (Iterator<RDFNode> i = list.iterator(); i.hasNext();) {
                            emitNode(i.next());
                        }
                        jw.endArray();
                    } else if (isMultiplyReferencedbNode(r)) {
                        if ( ! seenbNode(r)) {
                            roots.add(r);
                        }
                        jw.value( rules.encodebNodeId(bNodeIdFor(r)) );
                    } else {
                        encode(r);
                    }
                } else {
                    visitResource(r);
                    jw.value( rules.encodeResourceURI(context.findResource(r)) );
                }
            }
        }

        private int bNodeIdFor(Resource r) {
            AnonId id = r.getId();
            Integer shortId = bNodes.get( id );
            if (shortId == null) {
                shortId = bnodeCount++;
                bNodes.put(id, shortId);
            }
            return shortId;
        }
        
        private boolean seenbNode(Resource r) {
            return bNodes.containsKey( r.getId() );
        }

        private boolean isMultiplyReferencedbNode(Resource r) {
            ResIterator ri = model.listSubjectsWithProperty(null, r);
            boolean multiRef = false;
            if (ri.hasNext()) {
                ri.next();
                multiRef = ri.hasNext();
            }
            ri.close();
            return multiRef;
        }
    }
}

