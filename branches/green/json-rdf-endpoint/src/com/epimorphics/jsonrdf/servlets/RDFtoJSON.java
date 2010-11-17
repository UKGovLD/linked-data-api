/******************************************************************
 * File:        rdftoJSON.java
 * Created by:  Dave Reynolds
 * Created on:  31 Dec 2009
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

package com.epimorphics.jsonrdf.servlets;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.epimorphics.jsonrdf.Context;
import com.epimorphics.jsonrdf.Encoder;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.RDFNode;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.util.FileManager;

public class RDFtoJSON extends HttpServlet {

    private static final long serialVersionUID = -5279051478226030411L;

    /** Parameter name used for the RDF model to convert */
    public static final String SOURCE = "source";
    
    /** Parameter name used for RDF source format */
    public static final String FORMAT = "format";
    
    /** Parameter name used to indicate pretty printing of the raw JSON */
    public static final String PRETTY_PRINT = "PrettyPrint";
    
    /** Parameter name used to indicate (optional) base URL */
    public static final String BASE_URL = "base";
    
    /** Parameter name used to indicate (optional) ontology source */
    public static final String ONTOLOGY = "ontology";
    
    /** Parameter name used to indicate whether the ontology source should be used */
    public static final String ONTOLOGY_USED = "ontologyUsed";
    
    /** Parameter name used to indicate JSONP callback */
    public static final String CALLBACK = "callback";
    
    /** Parameter name used to indicate source of RDF to proxy */
    public static final String URL = "url";
    
    protected static final String LANGS[] = { "RDF/XML",
        "RDF/XML-ABBREV",
        "N-TRIPLE",
        "N-TRIPLES",
        "N3",
        "TURTLE",
        "Turtle",
        "TTL" };
    
    /**
     * POST option used to implement demo form. Parameters are:
     * <ul>
     * <li>source - text giving RDF graph in some format</li>
     * <li>format - the format of the RDF graph (Turtle, RDF/XML)</li>
     * <li>base - optional base URL</li>
     * <li>ontology - optional ontology graph in same format as source</li>
     * <li>ontologyUsed - flag to indicated ontology should be used in the encoding</li>
     * <li>PrintPrint - flag to request pretty printing of the json</li>
     * </ul>
     */
    public void doPost(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        
        Model src = extractModel(request, SOURCE);
        Model ont = null;
        if (request.getParameter(ONTOLOGY_USED) != null) {
            ont = extractModel(request, ONTOLOGY);
        }
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        
        String callback = request.getParameter(CALLBACK);
        if (callback != null) 
            out.print(callback + "(");
        emitJSON(request, src, ont, out);
        if (callback != null) 
            out.print(")");
        
        out.flush();
        out.close();
    }
    
    /**
     * GET option used to enable use as a proxy. 
     * TODO: Limit resource usage here (can't use threads in GAE!)
     * TODO: Add SPARQL result set alternative usage
     * <p>
     * Parameters:
     * </p>
     * <ul>
     * <li>url - the RDF source to be fetched</li>
     * <li>callback - optional JSONP prefix</li>
     * </ul>
     */
    
    // Example $ curl "http://localhost:8080/sdx-json-endpoint/rdfToJSON?url=http%3A%2F%2Fdbpedia.org%2Fresource%2FCambridge&PrettyPrint=true" 
    // Example $ curl "http://epimorph-pubx1.appspot.com/rdfToJSON?url=http%3A%2F%2Fdbpedia.org%2Fresource%2FCambridge&PrettyPrint=true" 
    public void doGet(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        try {
            String url = request.getParameter(URL);
            if (url != null) {
                
                Model src = FileManager.get().loadModel(url);
                Resource root = src.getResource(url);
                List<Resource> roots = new ArrayList<Resource>();
                roots.add( root );
                boolean fromRoot = src.contains(root, null, (RDFNode)null);
                
                response.setContentType("application/json");
                PrintWriter out = response.getWriter();
                
                String callback = request.getParameter(CALLBACK);
                if (callback != null) 
                    out.print(callback + "(");

                if (fromRoot) {
                    Encoder.get().encodeRecursive(src, roots, out, prettyPrint(request));
                } else {
                    Encoder.get().encode(src, out, prettyPrint(request));
                }
                if (callback != null) 
                    out.print(")");
                
                out.flush();
                out.close();
            } else {
                errorReport(response, "No URL parameter given");
            }
        } catch (Exception e) {
            errorReport(response, "Request failed: " + e.getMessage());
        }
    }

    private void errorReport(HttpServletResponse response, String message) throws IOException {
        response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, message);
    }

    private void emitJSON(HttpServletRequest request, Model src, Model ont,
            PrintWriter out) throws IOException {
        String base = request.getParameter(BASE_URL);
        Context context = null;
        if (ont != null) {
            context = (base != null) ? new Context(base, ont) : new Context(ont);
        } else {
            context = (base != null) ? new Context(base) : new Context();
        } 
        Encoder enc = Encoder.get(context);
        enc.encode(src, null, out, prettyPrint(request));
    }
    
    public Model extractModel(HttpServletRequest request, String param) {
        String rdfSrc = request.getParameter(param);
        if (rdfSrc == null) return null;
        Model src = ModelFactory.createDefaultModel();
        String format = request.getParameter(FORMAT);
        String lang = null;
        if (format != null) {
            for (String s : LANGS) {
                if (s.equalsIgnoreCase(format)) {
                    lang = s;
                    break;
                }
            }
        }
        if (lang == null) lang = "Turtle";
        src.read(new StringReader(rdfSrc), null, lang);
        return src;
    }
    
    public boolean prettyPrint(HttpServletRequest request) {
        return "true".equals(request.getParameter(PRETTY_PRINT));
    }
}

