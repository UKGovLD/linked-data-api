<?php

function createRDF ($dept, $date, $filename) {
  
  $fileLocation = "data/$dept/$date/$filename.rdf";

  if (!file_exists($fileLocation)) {
    $graph = "http://organogram.data.gov.uk/data/$dept/$date/$filename";
    $endpoint = 'http://localhost:8900/sparql';

    $sparql = <<<EOD
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX vcard: <http://www.w3.org/2006/vcard/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX sdmxa: <http://purl.org/linked-data/sdmx/2009/attribute#>
PREFIX sdmxc: <http://purl.org/linked-data/sdmx/2009/code#>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX copmv: <http://purl.org/net/opmv/types/common#>
PREFIX opmv: <http://purl.org/net/opmv/ns#>
PREFIX dgu: <http://reference.data.gov.uk/def/reference/>
PREFIX gov: <http://reference.data.gov.uk/def/central-government/>
PREFIX organogram: <http://reference.data.gov.uk/def/organogram/>
PREFIX grade: <http://reference.data.gov.uk/def/civil-service-grade/>
PREFIX payband: <http://reference.data.gov.uk/def/civil-service-payband/>
PREFIX postStatus: <http://reference.data.gov.uk/def/civil-service-post-status/>

CONSTRUCT { ?s ?p ?o . }
WHERE { 
  { ?s foaf:page ?graph } UNION { ?s qb:dataSet ?graph }
  ?s ?p ?o .
}
EOD;
    $sparql = str_replace('?graph', '<' . $graph . '>', $sparql);

    $query = array(
      'query' => $sparql
    );
    $queryString = http_build_query($query);

    $params = array(
      'http' => array(
        'method' => 'GET',
        'header' => "Host: " . $_SERVER["HTTP_HOST"],
        'max_redirects' => 1,
        'ignore_errors' => true
      )
    );
    $ctx = stream_context_create($params);
    try {
      $fp = fopen($endpoint . '?' . $queryString, 'rb', false, $ctx);
      if (!$fp) {
        header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
        echo "<html><head><title>Error Accessing SPARQL Endpoint</title></head><body><p>Problem accessing $endpoint</p></body></html>";
        return;
      } else {
        $response = stream_get_contents($fp);
        if ($response === false) {
          header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
          echo "<html><head><title>Error Getting Data</title></head><body><p>Problem reading data from $endpoint</p></body></html>";
          return;
        } else {
          // save the file
          try {
            $written = file_put_contents($fileLocation, $response, LOCK_EX);
          } catch (Exception $e) {
            header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
            echo "<html><head><title>Error Saving File</title></head><body><p>Exception " . $e->getMessage() . ".</p></body></html>";
            return;
          }
        }
      }
    } catch (Exception $e) {
      header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
      echo "<html><head><title>Error Getting Data</title></head><body><p>Exception " . $e->getMessage() . ".</p></body></html>";
      return;
    }
  }
  header($_SERVER["SERVER_PROTOCOL"] . " 307 Temporary Redirect");
  header("Location: /$fileLocation");
  echo "<html><head><title>Redirecting</title></head><body><p>You are being <a href=\"$fileLocation\">redirected</a> to the RDF file for download.</p></body></html>";
  return;
}

if (isset($_GET['dept']) && isset($_GET['date']) && isset($_GET['filename'])) {
  createRDF($_GET['dept'], $_GET['date'], $_GET['filename']);
  return;
} else if (isset($_GET['email']) && isset($_GET['date']) && isset($_GET['filename'])) {
  $dept = preg_replace('/\..+$/', '', preg_replace('/^.+@/', '', $_GET['email']));
  $date = preg_replace('!([0-9]{2})/([0-9]{2})/(20[0-9]{2})!', '$3-$2-$1', $_GET['date']);
  $filename = preg_replace('/\.xls/', '', $_GET['filename']);
  header($_SERVER["SERVER_PROTOCOL"] . " 301 Moved Permanently");
  header("Location: /download?dept=$dept&date=$date&filename=$filename");
  echo "<html><head><title>Redirecting</title></head><body><p>You are being redirected to the appropriate download page.</p></body></html>";
  return;
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Organogram Data Upload | data.gov.uk</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	
<link type="text/css" href="../css/upload.css" rel="stylesheet">

<script language="javascript" type="text/javascript" src="../scripts/jquery-1.4.4.min.js"></script>
<script language="javascript" type="text/javascript" src="../scripts/upload.js"></script>


</head>


<body class="dps">
<!--[if IE 7]> 
	<body class="IE7 dps"> 
<![endif]--> 
<!--[if IE 8]> 
	<body class="IE8 dps"> 
<![endif]--> 

<div id="page">



    <div role="banner" id="header">
      <div id="login">
      <img class="sprite" id="logo_hm-government" alt="HM Government logo" src="../images/1x1.gif">
     </div>
    <div class="inner">
   
   
	  	  <a title="Back to homepage" accesskey="1" class="sprite" id="logo_datagovuk" href="/"><span>Back to homepage</span></a>
	  	  
	  <span class="sprite" id="slogan"><span>Opening up government data</span></span>

    </div>
    </div> <!-- /#header-inner, /#header -->
    
    <div id="main">
                
        <div role="main" id="content">
  
  		
 		<div class="steps">
	 		<a class="step1 current" href="#upload">
	 		<div class="image"><img src="../images/upload_file.png" width="60" height="60" /></div>
	 		<div class="text"><p>Upload your spreadsheet</p></div>
	 		</a>
	 		<a class="step2" href="#preview">
	 		<div class="image"><img src="../images/preview.png" width="60" height="60"  /></div>
	 		<div class="text"><p>Preview organogram</p></div>	 		
	 		</a>
	 		<a class="step3" href="#download">
	 		<div class="image"><img src="../images/download_data.png" width="60" height="60"  /></div>
	 		<div class="text"><p>Download data</p></div>	 		
	 		</a>
	  		<div class="clear"><!-- --></div>
 		</div>
                        
  <div id="content-area">
    <div class="node-inner">

 	<div class="content">
  
	<div id="upload" class="upload panel">

	<!--
	  <div class="content-header">
		<h1 class="title">Upload your spreadsheet</h1>  	
	  </div> <!-- /#content-header -->	
	
	<!-- 
		<form id="upload_spreadsheet">
				<fieldset>
					<label>Title</label>
					<input type="text" />
					<label>Author</label>
					<input type="text" />
				 	<label>File</label>
					
					<input id="upload_data" class="file_input_textbox" readonly />
					 
					<div class="file_input_div">
					  <input type="file" />
					</div> 
					
				 	<input type="submit" value="Upload" />
				 	</fieldset>
			</legend>
		</form> -->
		
		<!-- 
		<form id="upload_spreadsheet" enctype="multipart/form-data" action="upload.php" method="post">
		<fieldset>
			<label>Department or organisation name</label>
			<input name="dept" type="text" maxlength="250" />
			<label>Snapshot date (dd/mm/yyyy)</label>
			<input type="text" name="date" maxlength="10" value="31/03/2011" />
		 	<label>Select spreadsheet file to upload</label>
		 	<input id="upload" name="file" type="file" /> 
		 	<input id="submit" type="submit" value="Upload" />
		 </fieldset>
		</form>
		-->
		
      <form id="upload_spreadsheet" method="post" action="/">
        <fieldset>
          <label for="email">Your email address</label>
          <input id="upload-email" name="email" type="email" />
          <label for="upload-file">Select spreadsheet file to upload</label>
          <input id="upload-file" name="file" type="file" />
          <label for="upload-date">Snapshot date (dd/mm/yyyy)</label>
          <input id="upload-date" type="text" name="date" maxlength="10" value="31/03/2011" />
          <input id="submit" type="submit" value="Upload" />
        </fieldset>
      </form>		
		
		
	  </div> <!-- end upload panel -->
	  
	  <div id="preview" class="preview panel">
	  <!--
	  <div class="content-header">
		<h1 class="title">Preview organogram</h1>  	
	  </div> <!-- /#content-header -->		  
	  <form>
	  
	  	<p>You can now preview the organogram generated from the 
 spreadsheet that you have provided.</p>
	  	<a class="preview_link" href="http://labs.data.gov.uk/gov-structure/organogram?dept=co&post=93&preview=true" target="_blank">Preview</a>
	  	</form>
	  </div> <!-- end preview panel -->
	  
	  <div id="download" class="download panel">
	<!--	
	  <div class="content-header">
		<h1 class="title">Download data</h1>  	
	  </div> <!-- /#content-header -->	

	      <form id="download_data" method="get" action="/download">
	        <fieldset>
	          <label for="download-email">Your email address</label>
	          <input id="download-email" name="email" type="email" />
	          <label for="download-filename">Filename of spreadsheet file</label>
	          <input id="download-filename" name="filename" type="text" />
	          <label for="download-date">Snapshot date (dd/mm/yyyy)</label>
	          <input id="download-date" type="text" name="date" maxlength="10" value="31/03/2011" />
	          <input type="submit" value="Download" />
	        </fieldset>
	      </form>

	  </div> <!-- end download panel -->
	  
	  </div>

 
  
</div> <!-- /node-inner, /node -->
          </div>
  
            
                    
           
  
        </div> <!-- /#content -->
                 
               
    </div> <!-- /#main -->

          <!-- <div id="footer">
</div><!-- footer -->


</body>
</html>
