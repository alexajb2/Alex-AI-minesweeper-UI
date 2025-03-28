"use server"

import { revalidatePath } from "next/cache"

export async function generateProblems(difficulty: string, count: number) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty, count }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to generate problems: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    revalidatePath("/")
    return data
  } catch (error) {
    console.error("Error generating problems:", error)
    throw error
  }
}

export async function processProblems() {
  try {
    const apiUrl = `${process.env.API_URL}/api/process`;
    console.log(`Sending process request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    console.log('Process Response Status:', response.status);
    console.log('Process Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Process Error ${response.status}: ${response.statusText}`);
      console.error(`Raw Process Response: ${errorText}`);
      throw new Error(
        `Failed to process problems: ${response.status} - ${response.statusText} \n Response: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Process Response Data:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("Error in processProblems:", error);
    throw error;
  }
}

export async function getProblem(id: number) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/problem/${id}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch problem: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching problem:", error)
    throw error
  }
}