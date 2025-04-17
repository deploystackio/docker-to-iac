import fetch from 'node-fetch';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

// Cache for the schema to avoid repeated fetching
let schemaCache: any = null;

/**
 * Validates data against the Render.com schema
 * @param data The YAML data to validate
 * @param schemaUrl URL to the Render.com schema
 * @returns Promise<boolean> indicating if validation passed
 */
export async function validateRenderSchema(
  data: any, 
  schemaUrl: string = 'https://render.com/schema/render.yaml.json'
): Promise<boolean> {
  try {
    // Fetch the schema if not already cached
    if (!schemaCache) {
      console.log('Fetching Render.com schema...');
      
      const response = await fetch(schemaUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText} (${response.status})`);
      }
      
      schemaCache = await response.json();
      console.log('Schema fetched successfully');
    }
    
    // Create an Ajv instance with support for 2020-12 draft
    const ajv = new Ajv2020({
      allErrors: true,
      verbose: true,
      strict: false,
      allowUnionTypes: true
    });
    
    // Add format validation
    addFormats(ajv);
    
    // First, try direct validation against the schema
    try {
      // Compile the schema
      const validate = ajv.compile(schemaCache);
      
      // Validate the data
      const isValid = validate(data);
      
      if (!isValid && validate.errors) {
        console.error('❌ Schema validation failed:');
        validate.errors.forEach((error, index) => {
          console.error(`Error ${index + 1}:`, JSON.stringify(error, null, 2));
        });
        return false;
      }
      
      console.log('✓ Schema validation passed');
      return true;
    } catch (validationError) {
      // If we have a schema compilation issue, try manual validation of key structure
      console.warn('Schema compilation error, falling back to structural validation:', validationError);
      return validateStructure(data);
    }
  } catch (error) {
    console.error('❌ Schema validation error:', error);
    return false;
  }
}

/**
 * Fallback validation that checks the structure of the Render YAML
 * @param data Render YAML data
 * @returns boolean indicating if basic structure is valid
 */
function validateStructure(data: any): boolean {
  try {
    let isValid = true;
    const issues: string[] = [];
    
    // Check that services is an array
    if (!data.services || !Array.isArray(data.services)) {
      issues.push('services must be an array');
      isValid = false;
    } else {
      // Validate each service has the required fields
      data.services.forEach((service: any, index: number) => {
        if (!service.name) {
          issues.push(`Service at index ${index} is missing a name`);
          isValid = false;
        }
        
        if (!service.type) {
          issues.push(`Service ${service.name || index} is missing a type`);
          isValid = false;
        }
        
        if (service.type === 'web' && !service.envVars && !Array.isArray(service.envVars)) {
          issues.push(`Service ${service.name || index} should have envVars as an array`);
          // Not a critical error, so we don't set isValid to false
        }
        
        if (service.image && !service.image.url) {
          issues.push(`Service ${service.name || index} has an image object but no url`);
          isValid = false;
        }
      });
    }
    
    // Check databases if present
    if (data.databases) {
      if (!Array.isArray(data.databases)) {
        issues.push('databases must be an array');
        isValid = false;
      } else {
        data.databases.forEach((db: any, index: number) => {
          if (!db.name) {
            issues.push(`Database at index ${index} is missing a name`);
            isValid = false;
          }
        });
      }
    }
    
    if (!isValid) {
      console.error('❌ Structure validation failed:');
      issues.forEach((issue, index) => {
        console.error(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✓ Structure validation passed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Structure validation error:', error);
    return false;
  }
}
