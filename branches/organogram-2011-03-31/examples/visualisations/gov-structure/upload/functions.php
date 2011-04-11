<?php

function organogramUrl ($dept, $isodate, $filenoext) {

  $graph = "http://organogram.data.gov.uk/data/$dept/$isodate/$filenoext";

  $endpoint = 'http://localhost:8900/sparql';
  $sparql = <<<LOCATION
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX gov: <http://reference.data.gov.uk/def/central-government/>
 
SELECT DISTINCT ?post
WHERE { 
?post foaf:page <$graph>; 
a gov:CivilServicePost . 
OPTIONAL { ?post org:reportsTo ?manager } 
FILTER (! BOUND(?manager)) 
}
ORDER BY ?post
LIMIT 1
LOCATION;

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
        return false;
      } else {
        $response = stream_get_contents($fp);
        if ($response === false) {
          header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
          echo "<html><head><title>Error Getting Data</title></head><body><p>Problem reading data from $endpoint</p></body></html>";
          return false;
        } else {

	$xml = simplexml_load_string($response);
	$uri = $xml->results->result->binding->uri;

	$parts = explode('/', substr($uri,strpos($uri,'/id/')+4));
     $deptOrPubBod = $parts[0] == 'department' ? 'dept' : 'pubbod';
     $deptOrPubBodId = $parts[1];
     $postId = $parts[3];

        return array(
          'deptOrPubBod' => $deptOrPubBod,
          'deptOrPubBodId' => $deptOrPubBodId,
          'postId' => $postId
        );
	}
      }
    } catch (Exception $e) {
      header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error");
      echo "<html><head><title>Error Getting Data</title></head><body><p>Exception " . $e->getMessage() . ".</p></body></html>";
      return false;
    }
}

function createSeniorCSV($filename) {

    $excel = new Spreadsheet_Excel_Reader();
    $excel->setOutputEncoding('CP1251');
    $excel->read($filename);

    $x=1;
    $sep = ",";

    ob_start();

    while($x<=$excel->sheets[4]['numRows']) {
     	$y=1;
     	$row="";

     	while($y<=17) {
         	$cell = isset($excel->sheets[4]['cells'][$x][$y]) ? $excel->sheets[4]['cells'][$x][$y] : '';
         	$row.=($row=="")?"\"".$cell."\"":"".$sep."\"".$cell."\"";
         	$y++;
     	} 

	if(strlen($row)>50) {     	
		echo $row."\n"; 
	}

    	$x++;

    }

    $extIndex = strrpos($filename, ".xls");
    $saveAs = substr($filename, 0, $extIndex) . '-senior-data.csv';

    $fp = fopen($saveAs,'w');
    fwrite($fp,ob_get_contents());
    fclose($fp);
    ob_end_clean();

}

function createJuniorCSV($filename) {

    $excel = new Spreadsheet_Excel_Reader();
    $excel->setOutputEncoding('CP1251');
    $excel->read($filename);

    $x=1;
    $sep = ",";

    ob_start();

    while($x<=$excel->sheets[6]['numRows']) {
     	$y=1;
     	$row="";

     	while($y<=10) {
         	$cell = isset($excel->sheets[6]['cells'][$x][$y]) ? $excel->sheets[6]['cells'][$x][$y] : '';
         	$row.=($row=="")?"\"".$cell."\"":"".$sep."\"".$cell."\"";
         	$y++;
     	} 

	if(strlen($row)>30) {     	
		echo $row."\n"; 
	}
    	$x++;

    }

    $extIndex = strrpos($filename, ".xls");
    $saveAs = substr($filename, 0, $extIndex) . '-junior-data.csv';

    $fp = fopen($saveAs,'w');
    fwrite($fp,ob_get_contents());
    fclose($fp);
    ob_end_clean();

}


function validEmail($email) {
   $isValid = true;
   $atIndex = strrpos($email, "@");
   if (is_bool($atIndex) && !$atIndex)
   {
      $isValid = false;
   } else {
      $domain = substr($email, $atIndex+1);
      $local = substr($email, 0, $atIndex);
      $localLen = strlen($local);
      $domainLen = strlen($domain);
      if ($localLen < 1 || $localLen > 64)
      {
         // local part length exceeded
         $isValid = false;
      }
      else if ($domainLen < 1 || $domainLen > 255)
      {
         // domain part length exceeded
         $isValid = false;
      }
      else if ($local[0] == '.' || $local[$localLen-1] == '.')
      {
         // local part starts or ends with '.'
         $isValid = false;
      }
      else if (preg_match('/\\.\\./', $local))
      {
         // local part has two consecutive dots
         $isValid = false;
      }
      else if (!preg_match('/^[A-Za-z0-9\\-\\.]+$/', $domain))
      {
         // character not valid in domain part
         $isValid = false;
      }
      else if (preg_match('/\\.\\./', $domain))
      {
         // domain part has two consecutive dots
         $isValid = false;
      }
      else if (!preg_match('/^(\\\\.|[A-Za-z0-9!#%&`_=\\/$\'*+?^{}|~.-])+$/', str_replace("\\\\","",$local)))
      {
         // character not valid in local part unless 
         // local part is quoted
         if (!preg_match('/^"(\\\\"|[^"])+"$/', str_replace("\\\\","",$local)))
         {
            $isValid = false;
         }
      }
   }
   return $isValid;
}

function departmentFromEmail($email) {
  $domain = substr($email, strrpos($email, "@") + 1);
  return substr($domain,0,strpos($domain,"."));
}

function isoFormatDate($date) {
  $parts = explode('/', $date);
  return "{$parts[2]}-{$parts[1]}-{$parts[0]}";
}

function make_dir_for_file($filesystemLoc) {
	$filesystemDir = dirname($filesystemLoc);
	$dirExists = file_exists($filesystemDir);
	if (!$dirExists) {
		$dirExists = mkdir($filesystemDir, 0755, true);
	}
	if (!is_writable($filesystemDir)) {
		$dirExists = chmod($filesystemDir, 755);
	}
	return $dirExists;
}


function file_upload_error_message($error_code) {
	switch ($error_code) {
		case UPLOAD_ERR_INI_SIZE:
			return 'The uploaded file exceeds the upload_max_filesize directive in php.ini';
		case UPLOAD_ERR_FORM_SIZE:
			return 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form';
		case UPLOAD_ERR_PARTIAL:
			return 'The uploaded file was only partially uploaded';
		case UPLOAD_ERR_NO_FILE:
			return 'No file was uploaded';
		case UPLOAD_ERR_NO_TMP_DIR:
			return 'Missing a temporary folder';
		case UPLOAD_ERR_CANT_WRITE:
			return 'Failed to write file to disk';
		case UPLOAD_ERR_EXTENSION:
			return 'File upload stopped by extension';
		default:
			return 'Unknown upload error';
	}
}

function writeTransformation($dept, $date, $filename, $xlwrapMappingsDir) {

	// set department and file extension
	$deptName = $dept;
	$ext="xls";

	// format the date	
	$parts = explode('-', $date);
	$dateSlash = "{$parts[2]}/{$parts[1]}/{$parts[0]}";

	// remove the .xls extension from filename
	$extIndex = strrpos($filename, ".xls");
	$path = substr($filename, 0, $extIndex);
	$saveAs = "data/$dept/$date/$path-mapping.trig";
	$xlwrapCopy = "$xlwrapMappingsDir/$dept-$date-$path.trig";

	$fileURL = "http://organogram.data.gov.uk/data/$dept/$date/$path";

// using heredoc syntax

$str = <<<TRANSFORMATION

@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix vcard: <http://www.w3.org/2006/vcard/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix void: <http://rdfs.org/ns/void#> .
@prefix time: <http://www.w3.org/2006/time#> .
@prefix qb: <http://purl.org/linked-data/cube#> .
@prefix sdmxa: <http://purl.org/linked-data/sdmx/2009/attribute#> .
@prefix sdmxc: <http://purl.org/linked-data/sdmx/2009/code#> .
@prefix org: <http://www.w3.org/ns/org#> .

@prefix copmv: <http://purl.org/net/opmv/types/common#> .
@prefix opmv: <http://purl.org/net/opmv/ns#> .

@prefix dgu: <http://reference.data.gov.uk/def/reference/> .
@prefix gov: <http://reference.data.gov.uk/def/central-government/> .
@prefix organogram: <http://reference.data.gov.uk/def/organogram/> .
@prefix grade: <http://reference.data.gov.uk/def/civil-service-grade/> .
@prefix payband: <http://reference.data.gov.uk/def/civil-service-payband/> .
@prefix postStatus: <http://reference.data.gov.uk/def/civil-service-post-status/> .

@prefix xl: <http://purl.org/NET/xlwrap#> .
@prefix debug: <http://debug.example.org/> .
@prefix :   <$fileURL/mapping> .

# mapping
{ [] a xl:Mapping ;
  xl:offline "false"^^xsd:boolean ;
  
  # datasets
  xl:template [
    xl:fileName "$fileURL.$ext" ;
    xl:sheetNumber "4" ;
    xl:templateGraph :datasets ;
    xl:transform [
      a xl:RowShift ;
      xl:breakCondition "ROW(A2) > 2" ;
    ]
  ] ;
  
  # senior staff posts
  xl:template [
    xl:fileName "$fileURL.$ext" ;
    xl:sheetNumber "4" ;
    xl:templateGraph :seniorPosts ;
    xl:transform [ 
      a xl:RowShift ;
      xl:breakCondition "EMPTY(A2)" ;
    ]
  ] ;

  # junior staff data
  xl:template [
    xl:fileName "$fileURL.$ext" ;
    xl:sheetNumber "6" ;
    xl:templateGraph :juniorStaff ;
    xl:transform [ 
      a xl:RowShift ;
      xl:breakCondition "EMPTY(A2)" ;
    ]
  ] ;
  .
}

:seniorPosts {
  
  [ xl:uri "IF(STRING(A2) != '0', NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & A2)"^^xl:Expr ] 
    a gov:CivilServicePost , gov:SeniorCivilServicePost ;
    rdfs:label "D2"^^xl:Expr ;
    rdfs:comment "E2"^^xl:Expr ;
    skos:notation "STRING(A2)"^^xl:Expr ;
    gov:postIn [ 
      # department or public body
      xl:uri "IF(STRING(A2) != '0', NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf'))"^^xl:Expr ;
      a gov:PublicBody, org:Organization ;
      a [ xl:uri "IF(F2 == G2, 'gov:Department')"^^xl:Expr ] ;
      rdfs:label "G2"^^xl:Expr ;
      dgu:uriSet [ xl:uri "'http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body')"^^xl:Expr ] ;
      org:hasUnit [ xl:uri "NAME2URI(NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/unit/', H2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/unit.rdf')"^^xl:Expr ] ;
      gov:parentDepartment [
        xl:uri "IF(F2 != G2 && STRING(A2) != '0', NAME2URI('http://reference.data.gov.uk/id/department/', F2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/department.rdf'))"^^xl:Expr ;
        a gov:Department, gov:PublicBody, org:Organization ;
        rdfs:label "F2"^^xl:Expr ;
        dgu:uriSet <http://reference.data.gov.uk/id/department> ;
        foaf:page <$fileURL> ;
      ] ;
      foaf:page <$fileURL> ;
    ], [ 
      # unit
      xl:uri "IF(STRING(A2) != '0', NAME2URI(NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/unit/', H2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/unit.rdf'))"^^xl:Expr ;
      a org:OrganizationalUnit ;
      rdfs:label "H2"^^xl:Expr ;
      org:unitOf [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf')"^^xl:Expr ] ;
      gov:hasPost [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & A2"^^xl:Expr ] ;
      foaf:page <$fileURL> ;
    ] ;
    grade:grade [ 
      xl:uri "'http://reference.data.gov.uk/def/civil-service-grade/' & UCASE(C2)"^^xl:Expr ;
      rdfs:label "UCASE(C2)"^^xl:Expr ;
    ] ;
    postStatus:postStatus [ xl:uri "'http://reference.data.gov.uk/def/civil-service-post-status/' & IF(LCASE(B2) == 'vacant', 'vacant', IF(LCASE(B2) == 'eliminated', 'eliminated', 'current'))"^^xl:Expr ] ;
    org:reportsTo [ xl:uri "IF(UCASE(STRING(K2)) != 'XX', NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & K2)"^^xl:Expr ; ] ;
    gov:heldBy [ 
      # person
      xl:uri "IF(LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated' && STRING(A2) != '0', '$fileURL#person' & ROW(A2))"^^xl:Expr ;
      a foaf:Person ;
      foaf:name "IF(UCASE(B2) != 'N/D' && UCASE(B2) != 'N/A', B2)"^^xl:Expr ;
      foaf:phone [
        xl:uri "IF(UCASE(I2) != 'N/D' && UCASE(I2) != 'N/A', 'tel:+44.' & SUBSTRING(SUBSTITUTE(I2, ' ', '.'), 1))"^^xl:Expr ;
        a vcard:Tel ;
        rdfs:label "I2"^^xl:Expr ;
        foaf:page <$fileURL> ;
      ] ;
      foaf:mbox [
        xl:uri "IF(UCASE(J2) != 'N/D' && UCASE(J2) != 'N/A', 'mailto:' & J2)"^^xl:Expr ;
        a vcard:Email ;
        rdfs:label "J2"^^xl:Expr ;
        foaf:page <$fileURL> ;
      ] ;
      gov:holdsPost [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & A2"^^xl:Expr ] ;
      gov:tenure [ 
        # tenure
        xl:uri "IF(STRING(A2) != '0', '$fileURL#tenure' & ROW(A2))"^^xl:Expr ;
        a gov:Tenure , org:Membership ;
        ## NOTE: derive label as "{person name} as {job title}"
        rdfs:label "B2 & ' as ' & D2"^^xl:Expr ;
        gov:postholder [ xl:uri "'$fileURL#person' & ROW(A2)"^^xl:Expr ] ;
        gov:post [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & A2"^^xl:Expr ] ;
        gov:salary "IF(UCASE(STRING(P2)) != 'N/D' && UCASE(STRING(P2)) != 'N/A', P2)"^^xl:Expr ;
        gov:fullTimeEquivalent "M2"^^xl:Expr ;
        foaf:page <$fileURL> ;
      ] ;
      foaf:page <$fileURL> ;
    ] ;
    gov:salaryRange [ 
      xl:uri "IF(UCASE(STRING(N2)) != 'N/D' && UCASE(STRING(N2)) != 'N/A' && LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated' && STRING(A2) != '0', 'http://reference.data.gov.uk/id/salary-range/' & N2 & '-' & O2)"^^xl:Expr ;
      a gov:SalaryRange ;
      ## NOTE: derive from salaries
      rdfs:label "'£' & N2 & ' - £' & O2"^^xl:Expr ;
      gov:lowerBound "N2"^^xl:Expr ;
      gov:upperBound "O2"^^xl:Expr ;
      dgu:uriSet <http://reference.data.gov.uk/id/salary-range> ;
      foaf:page <$fileURL> ;
    ] ;
    foaf:page <$fileURL> ;
    .
  
  # people without posts
  [ xl:uri "IF(LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated' && STRING(A2) == '0', '$fileURL#person' & ROW(A2))"^^xl:Expr ]
    a foaf:Person ;
    grade:grade [ xl:uri "'http://reference.data.gov.uk/def/civil-service-grade/' & UCASE(C2)"^^xl:Expr ] ;
    org:reportsTo [ xl:uri "IF(UCASE(STRING(K2)) != 'XX', NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & K2)"^^xl:Expr ] ;
    org:memberOf [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf')"^^xl:Expr ] ;
    org:hasMembership [ 
      xl:uri "IF(LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated' && STRING(A2) == '0', '$fileURL#tenure' & ROW(A2))"^^xl:Expr ;
      a org:Membership ;
      ## NOTE: derive label as "{person name} in {organisation}"
      rdfs:label "B2 & ' in ' & G2"^^xl:Expr ;
      org:member [ xl:uri "'$fileURL#person' & ROW(A2)"^^xl:Expr ] ;
      org:organization [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf')"^^xl:Expr ] ;
      gov:salaryRange [
        xl:uri "IF(UCASE(STRING(N2)) != 'N/D' && UCASE(STRING(N2)) != 'N/A' && LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated' && STRING(A2) == '0', 'http://reference.data.gov.uk/id/salary-range/' & N2 & '-' & O2)"^^xl:Expr ;
        a gov:SalaryRange ;
        ## NOTE: derive from salaries
        rdfs:label "'£' & N2 & ' - £' & O2"^^xl:Expr ;
        gov:lowerBound "N2"^^xl:Expr ;
        gov:upperBound "O2"^^xl:Expr ;
        dgu:uriSet <http://reference.data.gov.uk/id/salary-range> ;
        foaf:page <$fileURL> ;
      ] ;
      gov:fullTimeEquivalent "M2"^^xl:Expr ;
      foaf:page <$fileURL> ;
    ] ;
    foaf:page <$fileURL> ;
    .
  
  # salary cost of reports observation
  [ xl:uri "IF(LCASE(B2) != 'eliminated', '$fileURL#salaryCostOfReports' & ROW(A2))"^^xl:Expr ]
    a qb:Observation ;
    rdfs:label "D2 & ' Salary Cost of Reports on 31/03/2011'"^^xl:Expr ;
    qb:dataSet <$fileURL#salaryCostOfReports> ;
    organogram:date <http://reference.data.gov.uk/id/day/2011-03-31> ;
    organogram:post [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/post/' & A2"^^xl:Expr ] ;
    organogram:salaryCostOfReports "L2"^^xl:Expr ;
    .

  # totalPay observation
  [ xl:uri "IF((UCASE(C2) == 'SCS4' || UCASE(C2) == 'SCS3' || UCASE(C2) == 'SCS2') && LCASE(B2) != 'vacant' && LCASE(B2) != 'eliminated', '$fileURL#totalPay' & ROW(A2))"^^xl:Expr ]
    a qb:Observation ;
    rdfs:label "B2 & ' as ' & D2 & ' Total Pay on 31/03/2011'"^^xl:Expr ;
    qb:dataSet <$fileURL#totalPay> ;
    organogram:date <http://reference.data.gov.uk/id/day/2011-03-31> ;
    organogram:tenure [ xl:uri "'$fileURL#tenure' & ROW(A2)"^^xl:Expr ; ] ;
    organogram:totalPay "IF(UCASE(STRING(P2)) != 'N/D', P2)"^^xl:Expr ;
    sdmxa:obsStatus [ xl:uri "IF(UCASE(STRING(P2)) == 'N/D', 'http://purl.org/linked-data/sdmx/2009/code#obsStatus-M')"^^xl:Expr ] ;
    .

  # non-disclosed names
  [ xl:uri "IF(UCASE(B2) == 'N/D' && (UCASE(C2) == 'SCS4' || UCASE(C2) == 'SCS3' || UCASE(C2) == 'SCS2'), '$fileURL#nameDisclosure' & ROW(A2))"^^xl:Expr ]
    a gov:NonDisclosure , rdf:Statement ;
    rdfs:label "'Non-Disclosure of name of ' & D2"^^xl:Expr ;
    rdf:subject [ xl:uri "'$fileURL#person' & ROW(A2)"^^xl:Expr ] ;
    rdf:predicate foaf:name ;
    foaf:page <$fileURL> ;
    .

  # non-disclosed total pay
  [ xl:uri "IF(UCASE(STRING(P2)) == 'N/D' && (UCASE(C2) == 'SCS4' || UCASE(C2) == 'SCS3' || UCASE(C2) == 'SCS2'), '$fileURL#totalPayDisclosure' & ROW(A2))"^^xl:Expr ]
    a gov:NonDisclosure , rdf:Statement ;
    rdfs:label "'Non-Disclosure of total pay of ' & B2 & ' as ' & D2"^^xl:Expr ;
    rdf:subject [ xl:uri "'$fileURL#tenure
' & ROW(A2)"^^xl:Expr ] ;
    rdf:predicate gov:salary ;
    foaf:page <$fileURL> ;
    .

}

:datasets {

  ## NOTE: static across dataset
  <$fileURL>
    a opmv:Artifact, void:Dataset ;
    dct:title "G2 & ' Organogram at $dateSlash Dataset'"^^xl:Expr ;
    dct:license <http://reference.data.gov.uk/id/open-government-licence> ;
    dct:source <$fileURL.$ext> ;
    dct:temporal <http://reference.data.gov.uk/id/day/$date> ;
    void:exampleResource
      <http://reference.data.gov.uk/id/department/co> ,
      <$fileURL#person2> ,
      <$fileURL#tenure2> ;
    void:vocabulary 
      <http://www.w3.org/2000/01/rdf-schema> ,
      <http://www.w3.org/2004/02/skos/core> , 
      <http://xmlns.com/foaf/0.1/> ,
      <http://www.w3.org/ns/org> , 
      <http://reference.data.gov.uk/def/central-government/> ;
    void:subset
      <$fileURL#salaryCostOfReports> ,
      <$fileURL#totalPay> ,
      <$fileURL#juniorPosts> ,
      [
        # junior grade concept scheme
        xl:uri "SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/grade', '/id/', '/def/')"^^xl:Expr
      ] ,
      [
        # junior grade concept scheme
        xl:uri "SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (F2 == G2, 'department', 'public-body') & '/', G2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (F2 == G2, 'department', 'public-body') & '.rdf') & '/payband', '/id/', '/def/')"^^xl:Expr
      ] ;
    .

  ## NOTE: static across dataset
  <$fileURL#salaryCostOfReports>
    a void:Dataset , qb:DataSet ;
    dct:title "G2 & ' Salary Cost of Reports on $dateSlash Dataset'"^^xl:Expr ;
    dct:license <http://reference.data.gov.uk/id/open-government-licence> ;
    dct:source <$dateSlash.$ext> ;
    dct:temporal <http://reference.data.gov.uk/id/day/$date> ;
    qb:structure <http://reference.data.gov.uk/def/organogram/salary-costs-of-reports> ;
    void:exampleResource
      <$fileURL#salaryCostOfReports1> ;
    void:vocabulary
      <http://www.w3.org/2000/01/rdf-schema> ,
      <http://purl.org/linked-data/cube> ,
      <http://reference.data.gov.uk/def/organogram/> .

  ## NOTE: static across dataset
  <$fileURL#totalPay>
    a void:Dataset , qb:DataSet ;
    dct:title "G2 & ' Total Pay on $dateSlash Dataset'"^^xl:Expr ;
    dct:license <http://reference.data.gov.uk/id/open-government-licence> ;
    dct:source <$fileURL.$ext> ;
    dct:temporal <http://reference.data.gov.uk/id/day/$dateSlash> ;
    qb:structure <http://reference.data.gov.uk/def/organogram/total-pay> ;
    void:exampleResource
      <$fileURL#totalPay1> ;
    void:vocabulary
      <http://www.w3.org/2000/01/rdf-schema> ,
      <http://purl.org/linked-data/cube> ,
      <http://reference.data.gov.uk/def/organogram/> .

  ## NOTE: static across dataset
  <$fileURL#juniorPosts>
    a void:Dataset , qb:DataSet ;
    dct:title "G2 & ' Junior Post FTEs at $dateSlash Dataset'"^^xl:Expr ;
    dct:license <http://reference.data.gov.uk/id/open-government-licence> ;
    dct:source <$fileURL.$ext> ;
    dct:temporal <http://reference.data.gov.uk/id/day/$date> ;
    qb:structure <http://reference.data.gov.uk/def/organogram/junior-posts> ;
    void:exampleResource
      <$fileURL#juniorPosts1> ;
    void:vocabulary
      <http://www.w3.org/2000/01/rdf-schema> ,
      <http://purl.org/linked-data/cube> ,
      <http://reference.data.gov.uk/def/organogram/> .

  <http://reference.data.gov.uk/id/day/$date>
    a <http://reference.data.gov.uk/def/intervals/CalendarDay> ;
    rdfs:label "$date" .
    
  <http://reference.data.gov.uk/id/department>
    a dgu:UriSet , void:Dataset ;
    rdfs:label "Government Departments" ;
    void:class gov:Department ;
    void:exampleResource <http://reference.data.gov.uk/id/department/co> .
  
}

:juniorStaff {
  
  [ xl:uri "'$fileURL#juniorPosts' & ROW(A2)"^^xl:Expr ]
    a qb:Observation ;
    ## NOTE: construct from "{grade} {job title} ({profession}) in {unit} reporting to post {reports to} at $dateSlash"
    rdfs:label "E2 & ' ' & H2 & ' (' & J2 & ') in ' & UCASE(C2) & ' reporting to post ' & D2 & ' FTE at $dateSlash'"^^xl:Expr ;
    qb:dataSet <$fileURL#juniorPosts> ;
    organogram:date <http://reference.data.gov.uk/id/day/$date> ;
    organogram:unit [ xl:uri "NAME2URI(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/unit/', C2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/unit.rdf')"^^xl:Expr ; ] ;
    organogram:reportingTo [ xl:uri "NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/post/' & D2"^^xl:Expr ] ;
    organogram:grade [
      xl:uri "NAME2URI(SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/grade/', '/id/', '/def/'), E2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/grade.rdf')"^^xl:Expr ;
      a grade:Grade ;
      skos:prefLabel "'Grade ' & E2"^^xl:Expr ;
      skos:topConceptOf [
        # grade concept scheme
        xl:uri "SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/grade', '/id/', '/def/')"^^xl:Expr ;
        a skos:ConceptScheme , void:Dataset ;
        skos:prefLabel "B2 & ' Junior Civil Service Grades'"^^xl:Expr ;
        skos:hasTopConcept [
          # inverse pointer to grade
          xl:uri "NAME2URI(SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/grade/', '/id/', '/def/'), E2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/grade.rdf')"^^xl:Expr ;
        ] ;
      ] ;
      payband:payBand [
        xl:uri "NAME2URI(SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/payband/', '/id/', '/def/'), E2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/payband.rdf')"^^xl:Expr ;
        a payband:PayBand ;
        skos:prefLabel "E2 & ' Payband'"^^xl:Expr ;
        skos:topConceptOf [
          # payband concept scheme
          xl:uri "SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/payband', '/id/', '/def/')"^^xl:Expr ;
          a skos:ConceptScheme , void:Dataset ;
          skos:prefLabel "B2 & ' Junior Civil Service Grades'"^^xl:Expr ;
          skos:hasTopConcept [
            # inverse pointer to grade
            xl:uri "NAME2URI(SUBSTITUTE(NAME2URI('http://reference.data.gov.uk/id/' & IF (A2 == B2, 'department', 'public-body') & '/', B2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/' & IF (A2 == B2, 'department', 'public-body') & '.rdf') & '/payband/', '/id/', '/def/'), E2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/payband.rdf')"^^xl:Expr ;
          ] ;
        ] ;
        gov:salaryRange [ 
          xl:uri "'http://reference.data.gov.uk/id/salary-range/' & F2 & '-' & G2"^^xl:Expr ;
          a gov:SalaryRange ;
          ## NOTE: derive from salaries
          rdfs:label "'£' & F2 & ' - £' & G2"^^xl:Expr ;
          gov:lowerBound "F2"^^xl:Expr ;
          gov:upperBound "G2"^^xl:Expr ;
          dgu:uriSet <http://reference.data.gov.uk/id/salary-range> ;
          foaf:page <$fileURL> ;
        ] ;
      ] ;
    ] ;
    ## Note: assuming here that the job is a standard one
    organogram:job [
      xl:uri "NAME2URI('http://reference.data.gov.uk/def/civil-service-job/', H2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/job.rdf')"^^xl:Expr ;
      skos:prefLabel "H2"^^xl:Expr ;
    ] ;
    organogram:profession [
      xl:uri "NAME2URI('http://reference.data.gov.uk/def/civil-service-profession/', J2, 'mappings/reconcile/reference/diacritics.txt', 'mappings/reconcile/reference/profession.rdf')"^^xl:Expr ;
      skos:prefLabel "J2"^^xl:Expr ;
    ] ;
    organogram:fullTimeEquivalent "I2"^^xl:Expr ;
    .
  
}

TRANSFORMATION;

$stream = fopen($saveAs, 'w');
fwrite($stream, $str);
fclose($stream);

$stream = fopen($xlwrapCopy, 'w');
fwrite($stream, $str);
fclose($stream);

}


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
        return false;
      } else {
        $response = stream_get_contents($fp);
        if ($response === false) {
          return false;
        } else {
          // save the file
          try {
            $written = file_put_contents($fileLocation, $response, LOCK_EX);
          } catch (Exception $e) {
            return false;
          }
        }
      }
    } catch (Exception $e) {
      return false;
    }
  }
  return true;
}


?>
